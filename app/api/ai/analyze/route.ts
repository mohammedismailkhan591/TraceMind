import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import {
  allowedMimeTypes,
  buildAnalysisPrompt,
  getGeminiModelCandidates,
  isAudioMimeType,
  isRetryableModelError,
  normalizeAnalysisResult,
  normalizeMimeType,
  validateMediaNotMisclassified,
} from "../../../../lib/ai-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BASE64_LENGTH = 12_000_000;
const MAX_TEXT_LENGTH = 30_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonError(
  error: string,
  status: number
) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    // 1. Validate Supabase configuration.
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonError(
        "Supabase is not configured. Check your environment variables.",
        503
      );
    }

    // 2. Authenticate the user.
    const cookieStore = await cookies();

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
              cookiesToSet.forEach(
                ({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                }
              );
            } catch {
              // Cookie refresh may be handled by middleware.
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
      return jsonError(
        "Please log in to use TraceMind AI.",
        401
      );
    }

    // 3. Validate the Gemini API key.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return jsonError(
        "AI is not configured. Add GEMINI_API_KEY to your environment variables.",
        503
      );
    }

    // 4. Parse request data.
    const body = await request.json();

    const captureType =
      typeof body.captureType === "string"
        ? body.captureType
        : "text";

    let text =
      typeof body.text === "string"
        ? body.text.slice(0, MAX_TEXT_LENGTH)
        : "";

    const link =
      typeof body.link === "string"
        ? body.link.slice(0, 2000).trim()
        : "";

    const fileBase64 =
      typeof body.fileBase64 === "string"
        ? body.fileBase64
        : "";

    const mimeType = normalizeMimeType(
      typeof body.mimeType === "string"
        ? body.mimeType
        : ""
    );

    const isAudioInput =
      captureType === "voice" ||
      isAudioMimeType(mimeType);

    // 5. Validate uploaded content.
    if (
      fileBase64 &&
      !(
        allowedMimeTypes.has(mimeType) ||
        isAudioMimeType(mimeType)
      )
    ) {
      return jsonError(
        "Unsupported file type. Use an image, PDF, TXT, supported audio file, or a supported document.",
        415
      );
    }

    if (fileBase64.length > MAX_BASE64_LENGTH) {
      return jsonError(
        "The uploaded file is too large. Choose a smaller file.",
        413
      );
    }

    if (fileBase64) {
      const validation =
        validateMediaNotMisclassified(
          fileBase64,
          mimeType
        );

      if (!validation.valid) {
        return jsonError(
          validation.error || "Invalid uploaded file.",
          400
        );
      }
    }

    // 6. Extract plain text files.
    if (fileBase64 && mimeType === "text/plain") {
      try {
        const buffer = Buffer.from(
          fileBase64,
          "base64"
        );

        text = buffer
          .toString("utf8")
          .slice(0, MAX_TEXT_LENGTH);
      } catch {
        return jsonError(
          "Could not read the uploaded text file.",
          400
        );
      }
    }

    if (!text.trim() && !link && !fileBase64) {
      return jsonError(
        "Add text, a link, PDF, screenshot, document, or voice recording before analyzing.",
        400
      );
    }

    // 7. Build the analysis prompt.
    const prompt = buildAnalysisPrompt({
      captureType,
      text,
      link,
      fileBase64,
      mimeType,
    });

    const parts: Array<Record<string, unknown>> = [
      { text: prompt },
    ];

    // Plain text has already been extracted.
    // Other supported media can be supplied directly to Gemini.
    if (
      fileBase64 &&
      mimeType !== "text/plain"
    ) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: fileBase64,
        },
      });
    }

    // 8. Try the configured Gemini models.
    const models = getGeminiModelCandidates();

    let finalPayload: any = null;
    let lastStatus = 502;
    let lastMessage = "";
    let successful = false;

    for (const model of models) {
      // Retry transient server failures once for each model.
      for (let attempt = 0; attempt < 2; attempt++) {
        let response: Response;

        try {
          const modelUrl =
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

          response = await fetch(modelUrl, {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts,
                },
              ],

              generationConfig: {
                responseMimeType: "application/json",
                temperature: isAudioInput ? 0.1 : 0.2,
              },
            }),

            signal: AbortSignal.timeout(15_000),
          });
        } catch (error) {
          lastStatus = 503;

          lastMessage =
            error instanceof Error &&
            error.name === "TimeoutError"
              ? "The AI provider request timed out."
              : "Could not connect to the AI provider.";

          if (attempt === 0) {
            await sleep(700);
            continue;
          }

          break;
        }

        const payload = await response
          .json()
          .catch(() => null);

        if (response.ok) {
          finalPayload = payload;
          successful = true;
          break;
        }

        lastStatus = response.status;

        lastMessage =
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Unknown provider error";

        console.error(
          `Gemini model ${model} returned HTTP ${response.status}.`
        );

        const retryable = isRetryableModelError(
          response.status,
          lastMessage
        );

        if (!retryable) {
          break;
        }

        const temporaryServerFailure = [
          408,
          429,
          500,
          502,
          503,
          504,
        ].includes(response.status);

        if (
          attempt === 0 &&
          temporaryServerFailure
        ) {
          await sleep(700);
          continue;
        }

        break;
      }

      if (successful) {
        break;
      }

      if (
        !isRetryableModelError(
          lastStatus,
          lastMessage
        )
      ) {
        break;
      }
    }

    // 9. Return a safe, understandable error.
    if (!successful || !finalPayload) {
      let clientMessage =
        "AI analysis is temporarily unavailable. Please try again.";

      let status = 502;

      if (
        lastStatus === 401 ||
        lastStatus === 403
      ) {
        clientMessage =
          "AI configuration error. Check your Gemini API key.";

        status = 503;
      } else if (lastStatus === 429) {
        clientMessage =
          "The AI service is busy or rate-limited. Please try again shortly.";

        status = 429;
      } else if (lastStatus === 400) {
        clientMessage =
          "The AI service could not process this file or request. Check the file format and try again.";

        status = 400;
      } else if (lastStatus === 413) {
        clientMessage =
          "The uploaded content is too large for AI analysis.";

        status = 413;
      }

      return jsonError(clientMessage, status);
    }

    // 10. Extract the model's response.
    const raw =
      finalPayload?.candidates?.[0]?.content?.parts
        ?.map(
          (part: { text?: string }) =>
            part.text ?? ""
        )
        .join("");

    if (
      typeof raw !== "string" ||
      !raw.trim()
    ) {
      return jsonError(
        "AI returned an empty result. Please try again.",
        502
      );
    }

    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return jsonError(
        "AI returned an unreadable result. Please try again.",
        502
      );
    }

    // 11. Return normalized analysis data.
    return NextResponse.json(
      normalizeAnalysisResult(parsed)
    );
  } catch (error) {
    console.error(
      "TraceMind AI analysis failed:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return jsonError(
      "Could not analyze this item. Check your connection and try again.",
      500
    );
  }
}