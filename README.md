# TraceMind

**Trace what you remember. Find where you saw it.**

TraceMind is a personal information memory engine. It is designed to capture screenshots, PDFs, links, voice notes and text, understand the useful details, and let the user find them later using natural language.

## Included in this build

- Premium, responsive landing page
- Clean authenticated-app UI
- Dashboard
- Natural-language search experience
- Capture page for files, links and text
- Memories library
- Deadline/reminder interface
- Privacy/settings area
- Supabase production database schema
- User-specific Row Level Security foundation
- Storage model for uploaded assets
- Optional Gemini free-tier Smart Capture analysis (screenshots, PDFs, and pasted text)

## Run locally

1. Install Node.js 20+.
2. Copy `.env.local.example` to `.env.local`.
3. Add your Supabase URL and anon key.
4. Create a Supabase project.
5. Run `supabase/schema.sql` in the Supabase SQL Editor.
6. Create a private Storage bucket called `memory-assets`.
7. Install dependencies:

```bash
npm install
```

8. Start:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Important

Configure Supabase before testing authenticated pages. Smart Capture AI is optional and requires a server-only `GEMINI_API_KEY`; without it, saving works but AI analysis is unavailable. The AI endpoint checks the current Supabase user session.

Do not put secret API keys in `NEXT_PUBLIC_*` variables.

## Production direction

The next implementation layer should connect:

Capture -> Supabase Storage -> Gemini structured extraction -> memories table -> semantic search -> reminders. The first AI step does not yet transcribe voice notes or fetch full web pages from URLs.

For social login, enable the Google provider in Supabase Authentication and configure the callback URL for your deployment domain.

## Product principle

TraceMind should not become a feature-heavy dashboard. Every feature must help the user capture, understand, retrieve, connect or remember information.

## Storage + Capture update

For the real file upload flow, run `supabase/storage.sql` in the same Supabase project used by your `.env.local`. Then use the updated `app/capture/page.tsx`. See `SETUP-AND-FIX.md` for the exact order.
