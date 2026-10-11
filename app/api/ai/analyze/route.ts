import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase is not configured. Set your existing Supabase environment variables first." }, { status: 503 });
  }
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Middleware may own cookie refresh. */ }
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to use TraceMind AI." }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Free AI is not configured yet. Add GEMINI_API_KEY to .env.local, then restart the server." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const captureType = typeof body.captureType === "string" ? body.captureType : "text";
    const text = typeof body.text === "string" ? body.text.slice(0, 30000) : "";
    const link = typeof body.link === "string" ? body.link.slice(0, 2000) : "";
    const fileBase64 = typeof body.fileBase64 === "string" ? body.fileBase64 : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";

    if (fileBase64 && (!allowedMimeTypes.has(mimeType) || fileBase64.length > 12_000_000)) {
      return NextResponse.json({ error: "Use a PNG, JPG, WEBP, or PDF file smaller than about 8 MB for AI analysis." }, { status: 413 });
    }
    if (!text.trim() && !link.trim() && !fileBase64) {
      return NextResponse.json({ error: "Add text, a link, screenshot, or PDF before asking AI to analyze it." }, { status: 400 });
    }

    const prompt = `You are TraceMind, a careful personal information organizer. Analyze the provided content and return ONLY valid JSON with this shape:
{"title":"short recognizable title","category":"one of Tech, Hackathons, Jobs, Courses, Events, Articles, Scholarships, Messages, Other","summary":"2-4 concise sentences grounded in the supplied content","extractedText":"important source text, key facts, names, amounts, dates and instructions; concise but useful","deadlineISO":null,"tags":["tag1","tag2"],"isImportant":false}
Rules: Never invent facts. If no deadline is clearly stated, deadlineISO must be null. If a date has no year, do not guess the year; use null. If only a URL is supplied without page content, do not pretend you opened it: create a cautious title based on the URL and state in summary that the page content has not been imported yet. Category must be one of the exact options. Use ISO 8601 with timezone only for a clearly specified full deadline. Return JSON only.
Capture type: ${captureType}
URL (if supplied): ${link || "none"}
User text (if supplied): ${text || "none"}`;

    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    if (fileBase64) {
      parts.push({ inline_data: { mime_type: mimeType, data: fileBase64 } });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(45000),
      }
    );

    const payload = await response.json();
    if (!response.ok) {
      const providerMessage = payload?.error?.message;
      return NextResponse.json(
        { error: typeof providerMessage === "string" ? providerMessage : "The AI service could not analyze this item. Try again later." },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const raw = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("");
    if (typeof raw !== "string" || !raw.trim()) {
      return NextResponse.json({ error: "AI returned an empty result. Try again." }, { status: 502 });
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned an unreadable result. Try again." }, { status: 502 });
    }

    const categories = ["Tech", "Hackathons", "Jobs", "Courses", "Events", "Articles", "Scholarships", "Messages", "Other"];
    const category = typeof result.category === "string" && categories.includes(result.category) ? result.category : "Other";
    return NextResponse.json({
      title: typeof result.title === "string" ? result.title.slice(0, 180) : "Saved memory",
      category,
      summary: typeof result.summary === "string" ? result.summary.slice(0, 2000) : "",
      extractedText: typeof result.extractedText === "string" ? result.extractedText.slice(0, 12000) : "",
      deadlineISO: typeof result.deadlineISO === "string" && !Number.isNaN(Date.parse(result.deadlineISO)) ? result.deadlineISO : null,
      tags: Array.isArray(result.tags) ? result.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 8) : [],
      isImportant: result.isImportant === true,
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "AI analysis timed out. Try a smaller file or try again."
      : "Could not analyze this item. Check your connection and try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
