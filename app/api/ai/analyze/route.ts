import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { allowedMimeTypes, allowedAudioMimeTypes, buildAnalysisPrompt, getGeminiModelCandidates, isAudioMimeType, normalizeAnalysisResult } from "../../../../lib/ai-analysis";

export const runtime = "nodejs";

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
    const normalizedMime = mimeType.toLowerCase().split(";")[0].trim();
    const isAudioInput = captureType === "voice" || isAudioMimeType(mimeType);

    if (fileBase64 && !(allowedMimeTypes.has(normalizedMime) || isAudioMimeType(mimeType))) {
      return NextResponse.json({ error: "Use a supported image, PDF, or audio file for AI analysis." }, { status: 413 });
    }

    if (fileBase64 && fileBase64.length > 12_000_000) {
      return NextResponse.json({ error: "Choose a file smaller than about 8 MB for AI analysis." }, { status: 413 });
    }
    if (!text.trim() && !link.trim() && !fileBase64) {
      return NextResponse.json({ error: "Add text, a link, screenshot, PDF, or voice note before asking AI to analyze it." }, { status: 400 });
    }

    const prompt = buildAnalysisPrompt({ captureType, text, link, fileBase64, mimeType });
    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    if (fileBase64) {
      parts.push({ inline_data: { mime_type: mimeType, data: fileBase64 } });
    }

    const modelCandidates = getGeminiModelCandidates();
    let response: Response | null = null;
    let payload: any = null;

    for (const model of modelCandidates) {
      const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      response = await fetch(modelUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { responseMimeType: "application/json", temperature: isAudioInput ? 0.15 : 0.2 },
        }),
        signal: AbortSignal.timeout(45000),
      });

      payload = await response.json().catch(() => null);
      if (response.ok) {
        break;
      }

      const providerMessage = typeof payload?.error?.message === "string" ? payload.error.message : "";
      const isUnavailableModel = /model.*not.*available|not available|unsupported model|not found/i.test(providerMessage);
      if (!isUnavailableModel) {
        break;
      }
    }

    if (!response || !response.ok) {
      const providerMessage = payload?.error?.message;
      return NextResponse.json(
        { error: typeof providerMessage === "string" ? providerMessage : "The AI service could not analyze this item. Try again later." },
        { status: response?.status === 429 ? 429 : 502 }
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

    return NextResponse.json(normalizeAnalysisResult(result));
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "AI analysis timed out. Try a smaller file or try again."
      : "Could not analyze this item. Check your connection and try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
