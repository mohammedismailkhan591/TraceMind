-- TraceMind production database foundation
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  content text,
  category text default 'Other',
  source_type text not null,
  source_url text,
  deadline timestamptz,
  is_favorite boolean default false,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists memory_assets (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  file_size bigint,
  created_at timestamptz default now()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid references memories(id) on delete cascade,
  title text not null,
  reminder_at timestamptz not null,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unique(user_id, name)
);

create table if not exists memory_tags (
  memory_id uuid references memories(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key(memory_id, tag_id)
);

create index if not exists memories_user_id_idx on memories(user_id);
create index if not exists memories_deadline_idx on memories(deadline);
create index if not exists reminders_user_id_idx on reminders(user_id);
create index if not exists reminders_at_idx on reminders(reminder_at);

alter table profiles enable row level security;
alter table memories enable row level security;
alter table memory_assets enable row level security;
alter table reminders enable row level security;
alter table tags enable row level security;
alter table memory_tags enable row level security;

create policy "Users manage own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage own memories" on memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own assets" on memory_assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own reminders" on reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own tags" on tags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket:
-- Create a private bucket named "memory-assets" in Supabase Storage.
-- Add storage policies allowing authenticated users to access only
-- paths beginning with their own auth.uid().
