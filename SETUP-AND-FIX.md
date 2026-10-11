# TraceMind setup

## 1. Install

```bash
npm install
```

## 2. Configure Supabase

Copy `.env.local.example` to `.env.local` and replace both values with the values from:

Supabase Dashboard -> your project -> Project Settings -> API

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Restart the development server after changing `.env.local`:

```bash
npm run dev
```

If these values are missing, TraceMind will still render its UI instead of crashing, but authentication, memories, capture storage, and reminders cannot work until Supabase is configured.

## TraceMind visual structure refresh (October 2026)

This update refreshes the shared application navigation and adds a dedicated `/timeline` page for browsing recent memories chronologically. Each memory detail page now includes a memory-context view, key facts, source information, and a record-based timeline showing saved/source/deadline/updated events where those fields exist.

### Important notes
- The timeline is based on the existing `memories` table and the fields already used by this project. It does not invent a full audit log; the memory detail page explicitly explains that only events supported by stored fields are shown.
- The project still expects the existing Supabase configuration in `.env.local`. Do not commit API keys or secrets.
- Smart Capture AI is implemented as an optional Gemini free-tier integration; see the setup section below.

## 3. Optional Smart Capture AI (Gemini free tier)

Smart Capture can suggest a title, category, summary, extracted text, tags, and a deadline for screenshots, PDFs, and pasted text. URL-only analysis is deliberately cautious: it does not claim to read the web page unless page content is supplied.

1. Create a Gemini API key in Google AI Studio: https://aistudio.google.com/app/apikey
2. Add it to your local `.env.local` file (server-side only):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Restart `npm run dev`.
4. On Capture, add your item and click **Analyze with AI**. Review every suggestion, especially deadlines, before saving.

The Gemini API has a free tier with model and rate limits that may change. Do not use `NEXT_PUBLIC_GEMINI_API_KEY`; never commit `.env.local` or share your key. AI is optional: capture and save can still be used without configuring it. Supported AI files are PNG, JPG, WEBP, and PDF up to 8 MB. Voice transcription and live web-page fetching are not part of this first AI step.
