import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const text = body.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        {
          error: "No text was provided.",
        },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content: `
You are the intelligence engine for TraceMind.

TraceMind helps users remember information they previously saw,
received, or saved.

Analyze the provided information and return ONLY valid JSON.

Extract:

title
summary
category
important_details
deadline
source
keywords

Category must be one of:
Scholarship
Job
Hackathon
Course
Event
Article
Message
Other

Rules:
- Do not invent information.
- If a deadline is not present, return null.
- If a source is not present, return null.
- important_details should contain the most useful facts.
- keywords should contain useful search terms.
- Keep the summary concise.
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const result = response.output_text;

    let parsed;

    try {
      parsed = JSON.parse(result);
    } catch {
      return NextResponse.json(
        {
          error: "AI returned invalid JSON.",
          raw: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);

  } catch (error) {
    console.error("AI processing error:", error);

    return NextResponse.json(
      {
        error: "AI processing failed.",
      },
      { status: 500 }
    );
  }
}