# TraceMind — Storage + Capture fix

This package fixes the real Capture flow and gives the Capture page a more professional UI.

## 1. Supabase storage

Open the **same Supabase project used by `.env.local`**.

Go to **SQL Editor → New query** and paste/run the complete file:

`supabase/storage.sql`

The last query should return one row:

`memory-assets | memory-assets | false`

If it does not, stop and copy the exact SQL error.

## 2. Replace the Capture page

Replace:

`app/capture/page.tsx`

with the version in this package.

## 3. Check `.env.local`

The project URL must be from the same Supabase project where the bucket exists:

`NEXT_PUBLIC_SUPABASE_URL=...`

`NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

Do not put the Supabase service-role key in a browser/client environment.

## 4. Restart Next.js

Stop the terminal with `Ctrl+C`, then run:

`npm.cmd run dev`

## 5. Test

Log in → Capture → Screenshot → choose an image → Save memory.

Then verify:

- Storage → `memory-assets` → your user-id folder
- Table Editor → `memories`
- Table Editor → `memory_assets`

The app uses the path:

`YOUR_USER_ID/unique-file-name.ext`

so storage policies can isolate each user's files.
