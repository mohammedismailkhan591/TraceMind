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
- OpenAI environment variable ready for AI processing

## Run locally

1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
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

The UI in this package is the product foundation. The database schema is real and ready for Supabase, but the authentication buttons and AI extraction endpoint still need to be wired to your project's credentials before public deployment.

Do not put secret API keys in `NEXT_PUBLIC_*` variables.

## Production direction

The next implementation layer should connect:

Capture -> Supabase Storage -> OCR/PDF extraction -> OpenAI structured extraction -> memories table -> embeddings -> semantic search -> reminders.

For social login, enable Google and Facebook providers in Supabase Authentication and connect the callback URL for your Vercel domain.

## Product principle

TraceMind should not become a feature-heavy dashboard. Every feature must help the user capture, understand, retrieve, connect or remember information.

## Storage + Capture update

For the real file upload flow, run `supabase/storage.sql` in the same Supabase project used by your `.env.local`. Then use the updated `app/capture/page.tsx`. See `SETUP-AND-FIX.md` for the exact order.
