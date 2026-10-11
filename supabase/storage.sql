-- TraceMind Storage setup
-- Run this whole file once in Supabase SQL Editor.
-- It creates/repairs the private memory-assets bucket and its security policies.

insert into storage.buckets (id, name, public)
values ('memory-assets', 'memory-assets', false)
on conflict (id) do update
set name = excluded.name,
    public = false;

-- Remove old versions of these policies so this script can be safely re-run.
drop policy if exists "TraceMind users upload own files" on storage.objects;
drop policy if exists "TraceMind users read own files" on storage.objects;
drop policy if exists "TraceMind users update own files" on storage.objects;
drop policy if exists "TraceMind users delete own files" on storage.objects;

create policy "TraceMind users upload own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'memory-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "TraceMind users read own files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'memory-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "TraceMind users update own files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'memory-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'memory-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "TraceMind users delete own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'memory-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Verification: this should return exactly one row.
select id, name, public
from storage.buckets
where id = 'memory-assets';
