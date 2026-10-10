import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

const categories = [
  "Tech",
  "Hackathons",
  "Jobs",
  "Courses",
  "Events",
  "Articles",
  "Scholarships",
  "Messages",
  "Other",
];

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user with Supabase
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase is not configured. Check your environment variables." },
        { status: 503 }
      );
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Middleware may handle cookie refresh.
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to use TraceMind AI." },
        { status: 401 }
      );
    }

    // 2. Check Gemini API configuration
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini AI is not configured. Add GEMINI_API_KEY to .env.local and restart the server.",
        },
        { status: 503 }
      );
    }

    // 3. Read the submitted content
    const body = await request.json();

    const captureType =
      typeof body.captureType === "string"
        ? body.captureType
        : "text";

    const text =
      typeof body.text === "string"
        ? body.text.slice(0, 30000)
        : "";

    const link =
      typeof body.link === "string"
        ? body.link.slice(0, 2000)
        : "";

    const fileBase64 =
      typeof body.fileBase64 === "string"
        ? body.fileBase64
        : "";

    const mimeType =
      typeof body.mimeType === "string"
        ? body.mimeType
        : "";

    // 4. Validate uploaded files
    if (fileBase64) {
      if (
        !allowedMimeTypes.has(mimeType) ||
        fileBase64.length > 12_000_000
      ) {
        return NextResponse.json(
          {
            error:
              "Upload a PNG, JPG, WEBP, or PDF file smaller than approximately 8 MB.",
          },
          { status: 413 }
        );
      }
    }

    if (!text.trim() && !link.trim() && !fileBase64) {
      return NextResponse.json(
        {
          error:
            "Add text, a link, a screenshot, or a PDF before asking AI to analyze it.",
        },
        { status: 400 }
      );
    }

    // 5. Create the TraceMind AI prompt
    const prompt = `
You are TraceMind, a careful personal information organizer.

Analyze the supplied content and return ONLY valid JSON with this exact structure:

{
  "title": "short recognizable title",
  "category": "one of Tech, Hackathons, Jobs, Courses, Events, Articles, Scholarships, Messages, Other",
  "summary": "2-4 concise sentences grounded in the supplied content",
  "extractedText": "important source text, key facts, names, amounts, dates and instructions",
  "deadlineISO": null,
  "tags": ["tag1", "tag2"],
  "isImportant": false
}

RULES:
- Never invent facts or claim to have read content that was not supplied.
- Choose a category from the exact list provided.
- If no deadline is clearly stated, use null.
- If a date has no year, do not guess the year.
- Use ISO 8601 with timezone only when the full deadline is clearly specified.
- If only a URL is provided without imported page content, explain that the page content has not been imported yet.
- Extract useful names, dates, amounts, deadlines, and instructions.
- Set isImportant to true only when the content supports that decision.
- Return valid JSON only. Do not include Markdown fences.

Capture type: ${captureType}
URL: ${link || "none"}
User text: ${text || "none"}
`;

    // 6. Prepare the Gemini Interactions API input
    const input: any[] = [
      {
        type: "text",
        text: prompt,
      },
    ];

    if (fileBase64) {
      if (mimeType === "application/pdf") {
        input.push({
          type: "document",
          mime_type: "application/pdf",
          data: fileBase64,
        });
      } else {
        input.push({
          type: "image",
          mime_type: mimeType,
          data: fileBase64,
        });
      }
    }

    // 7. Call Gemini 3.8 Flash
    const ai = new GoogleGenAI({
      apiKey,
    });

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input,
    });

    const raw = interaction.output_text;

    if (typeof raw !== "string" || !raw.trim()) {
      return NextResponse.json(
        { error: "AI returned an empty result. Please try again." },
        { status: 502 }
      );
    }

    // 8. Parse the AI response
    let result: Record<string, unknown>;

    try {
      // Handle accidental Markdown fences if the model returns them.
      const cleaned = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

      result = JSON.parse(cleaned);
    } catch {
      console.error("Gemini returned invalid JSON:", raw);

      return NextResponse.json(
        {
          error:
            "AI returned an unreadable result. Please try again.",
        },
        { status: 502 }
      );
    }

    // 9. Validate and normalize the result
    const category =
      typeof result.category === "string" &&
      categories.includes(result.category)
        ? result.category
        : "Other";

    const tags = Array.isArray(result.tags)
      ? result.tags
          .filter(
            (tag): tag is string =>
              typeof tag === "string"
          )
          .slice(0, 8)
          .map((tag) => tag.slice(0, 50))
      : [];

    const deadlineISO =
      typeof result.deadlineISO === "string" &&
      !Number.isNaN(Date.parse(result.deadlineISO))
        ? result.deadlineISO
        : null;

    // 10. Return the analyzed memory to TraceMind
    return NextResponse.json({
      success: true,
      title:
        typeof result.title === "string"
          ? result.title.slice(0, 180)
          : "Saved memory",

      category,

      summary:
        typeof result.summary === "string"
          ? result.summary.slice(0, 2000)
          : "",

      extractedText:
        typeof result.extractedText === "string"
          ? result.extractedText.slice(0, 12000)
          : "",

      deadlineISO,
      tags,
      isImportant: result.isImportant === true,
    });
  } catch (error) {
    console.error("TraceMind AI error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "";

    if (
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError")
    ) {
      return NextResponse.json(
        {
          error:
            "AI analysis timed out. Try a smaller file or try again.",
        },
        { status: 504 }
      );
    }

    if (
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("rate limit")
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini AI usage is temporarily limited. Please try again later.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Could not analyze this item. Check the server logs and try again.",
      },
      { status: 500 }
    );
  }
}