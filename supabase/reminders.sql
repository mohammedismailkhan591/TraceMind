-- TraceMind deadline reminder schedule
-- Run this ONCE in Supabase SQL Editor after schema.sql.

alter table reminders
  add column if not exists reminder_kind text not null default 'custom';

alter table reminders
  add column if not exists deadline_at timestamptz;

create index if not exists reminders_deadline_at_idx
  on reminders(deadline_at);

create unique index if not exists reminders_user_memory_kind_unique
  on reminders(user_id, memory_id, reminder_kind)
  where memory_id is not null;

-- Optional helper comment:
-- TraceMind automatically creates exactly: 24h, 7h, 1h.
-- Custom reminders remain supported when created manually.
