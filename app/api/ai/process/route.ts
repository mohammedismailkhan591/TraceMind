import { NextResponse } from "next/server";

function detectCategory(text: string) {
  const t = text.toLowerCase();
  if (/scholarship|fellowship|stipend/.test(t)) return "Scholarship";
  if (/internship|job|hiring|vacancy|career/.test(t)) return "Job";
  if (/hackathon|hackfest|competition/.test(t)) return "Hackathon";
  if (/course|bootcamp|workshop|class/.test(t)) return "Course";
  if (/event|conference|meetup|webinar/.test(t)) return "Event";
  if (/article|blog|research paper/.test(t)) return "Article";
  if (/whatsapp|message|chat/.test(t)) return "Message";
  return "Other";
}

function summarize(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(" ").slice(0, 420);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "No text was provided." }, { status: 400 });
    }

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((word: string) => word.length > 3);

    const keywords = Array.from(new Set(words)).slice(0, 12);

    const dateMatch =
      text.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/) ||
      text.match(/\b(?:\d{1,2}\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?\b/i);

    return NextResponse.json({
      title: text.split(/\r?\n/).map((x: string) => x.trim()).find(Boolean)?.slice(0, 100) || "Saved memory",
      summary: summarize(text),
      category: detectCategory(text),
      important_details: [],
      deadline: dateMatch?.[0] || null,
      source: null,
      keywords,
      processing: "local",
    });
  } catch {
    return NextResponse.json({ error: "Local processing failed." }, { status: 500 });
  }
}
