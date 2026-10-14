-- TraceMind notification preferences and scheduled reminder delivery.
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  deadline_reminders boolean not null default true,
  weekly_summary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read own notification preferences"
  on public.notification_preferences;
create policy "Users can read own notification preferences"
  on public.notification_preferences
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification preferences"
  on public.notification_preferences;
create policy "Users can insert own notification preferences"
  on public.notification_preferences
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification preferences"
  on public.notification_preferences;
create policy "Users can update own notification preferences"
  on public.notification_preferences
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.reminders
  add column if not exists notification_status text not null default 'pending';

alter table public.reminders
  add column if not exists notification_sent_at timestamptz;

alter table public.reminders
  add column if not exists notification_error text;

create index if not exists reminders_pending_notification_idx
  on public.reminders (reminder_at)
  where completed = false and notification_status = 'pending';
