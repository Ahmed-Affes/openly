-- ================================================================
-- OPENLY SUPABASE DATABASE SETUP (COMPLETE SCHEMA + RLS + REALTIME)
-- ================================================================
-- Run this entire script in your Supabase SQL Editor.

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. ROOMS TABLE
create table if costly exists rooms (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  type text not null check (type in ('open_feedback', 'qa', 'hot_take', 'decision_vote', 'pulse_check')),
  status text default 'open' check (status in ('open', 'closed', 'scheduled')),
  is_recurring boolean default false,
  cadence text check (cadence in ('weekly', 'biweekly', 'monthly')),
  max_participants int,
  opens_at timestamptz default now(),
  closes_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Drop table if recreation needed / create if not exists
create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  type text not null check (type in ('open_feedback', 'qa', 'hot_take', 'decision_vote', 'pulse_check')),
  status text default 'open' check (status in ('open', 'closed', 'scheduled')),
  is_recurring boolean default false,
  cadence text check (cadence in ('weekly', 'biweekly', 'monthly')),
  max_participants int,
  opens_at timestamptz default now(),
  closes_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. QUESTIONS TABLE
create table if not exists questions (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade,
  text text not null,
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- 3. SUBMISSIONS TABLE (fully anonymous)
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade,
  device_hash text not null,
  created_at timestamptz default now()
);

-- 4. ANSWERS TABLE (reaction_level between 0 and 100)
create table if not exists answers (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references submissions(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  text text,
  reaction_level int check (reaction_level between 0 and 100),
  intensity text check (intensity in ('thought', 'urgent')),
  created_at timestamptz default now()
);

-- 5. THREADS TABLE
create table if not exists threads (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references submissions(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  is_resolved boolean default false,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

-- 6. THREAD MESSAGES TABLE
create table if not exists thread_messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references threads(id) on delete cascade,
  sender text not null check (sender in ('creator', 'responder')),
  text text not null,
  created_at timestamptz default now()
);

-- 7. VOTES TABLE
create table if not exists votes (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references submissions(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  device_hash text not null,
  vote_type text check (vote_type in ('up', 'down', 'yes', 'no', 'unsure')),
  created_at timestamptz default now(),
  unique(submission_id, device_hash)
);

-- 8. INVITES TABLE
create table if not exists invites (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade,
  email text not null,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- 9. USER SETTINGS TABLE
create table if not exists user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  email_notifications boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
create index if not exists rooms_creator_id_idx on rooms(creator_id);
create index if not exists rooms_status_idx on rooms(status);
create index if not exists questions_room_id_idx on questions(room_id);
create index if not exists submissions_room_id_idx on submissions(room_id);
create index if not exists submissions_device_hash_idx on submissions(device_hash);
create index if not exists answers_submission_id_idx on answers(submission_id);
create index if not exists answers_question_id_idx on answers(question_id);
create index if not exists threads_submission_id_idx on threads(submission_id);
create index if not exists threads_room_id_idx on threads(room_id);
create index if not exists thread_messages_thread_id_idx on thread_messages(thread_id);
create index if not exists votes_submission_id_idx on votes(submission_id);
create index if not exists votes_room_id_idx on votes(room_id);
create index if not exists invites_room_id_idx on invites(room_id);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

alter table rooms enable row level security;
alter table questions enable row level security;
alter table submissions enable row level security;
alter table answers enable row level security;
alter table threads enable row level security;
alter table thread_messages enable row level security;
alter table votes enable row level security;
alter table invites enable row level security;
alter table user_settings enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Creators manage their rooms" on rooms;
drop policy if exists "Anyone can view rooms" on rooms;
drop policy if exists "Creators manage questions" on questions;
drop policy if exists "Anyone can read questions" on questions;
drop policy if exists "Anyone can insert submissions" on submissions;
drop policy if exists "Creators can read their room submissions" on submissions;
drop policy if exists "Anyone can insert answers" on answers;
drop policy if exists "Creators can read answers" on answers;
drop policy if exists "Creators manage threads" on threads;
drop policy if exists "Anyone can insert threads" on threads;
drop policy if exists "Anyone can read threads" on threads;
drop policy if exists "Anyone can insert thread messages" on thread_messages;
drop policy if exists "Anyone can read thread messages" on thread_messages;
drop policy if exists "Anyone can vote" on votes;
drop policy if exists "Creators can read votes" on votes;
drop policy if exists "Anyone can read votes" on votes;
drop policy if exists "Creators manage invites" on invites;
drop policy if exists "Users manage their own settings" on user_settings;

-- Rooms policies
create policy "Creators manage their rooms"
on rooms for all
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "Anyone can view rooms"
on rooms for select
using (true);

-- Questions policies
create policy "Creators manage questions"
on questions for all
using (exists (
  select 1 from rooms
  where rooms.id = questions.room_id
  and rooms.creator_id = auth.uid()
))
with check (exists (
  select 1 from rooms
  where rooms.id = questions.room_id
  and rooms.creator_id = auth.uid()
));

create policy "Anyone can read questions"
on questions for select
using (true);

-- Submissions policies
create policy "Anyone can insert submissions"
on submissions for insert
with check (true);

create policy "Creators can read their room submissions"
on submissions for select
using (exists (
  select 1 from rooms
  where rooms.id = submissions.room_id
  and rooms.creator_id = auth.uid()
));

-- Answers policies
create policy "Anyone can insert answers"
on answers for insert
with check (true);

create policy "Creators can read answers"
on answers for select
using (exists (
  select 1 from submissions
  join rooms on rooms.id = submissions.room_id
  where submissions.id = answers.submission_id
  and rooms.creator_id = auth.uid()
));

-- Threads policies
create policy "Creators manage threads"
on threads for all
using (exists (
  select 1 from rooms
  where rooms.id = threads.room_id
  and rooms.creator_id = auth.uid()
))
with check (exists (
  select 1 from rooms
  where rooms.id = threads.room_id
  and rooms.creator_id = auth.uid()
));

create policy "Anyone can insert threads"
on threads for insert
with check (true);

create policy "Anyone can read threads"
on threads for select
using (true);

-- Thread messages policies
create policy "Anyone can insert thread messages"
on thread_messages for insert
with check (true);

create policy "Anyone can read thread messages"
on thread_messages for select
using (true);

-- Votes policies
create policy "Anyone can vote"
on votes for insert
with check (true);

create policy "Anyone can read votes"
on votes for select
using (true);

-- Invites policies
create policy "Creators manage invites"
on invites for all
using (exists (
  select 1 from rooms
  where rooms.id = invites.room_id
  and rooms.creator_id = auth.uid()
))
with check (exists (
  select 1 from rooms
  where rooms.id = invites.room_id
  and rooms.creator_id = auth.uid()
));

-- User settings policies
create policy "Users manage their own settings"
on user_settings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ================================================================
-- AUTH HOOK / TRIGGER FOR AUTOMATIC USER SETTINGS
-- ================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id, email_notifications)
  values (new.id, true)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================
-- SUPABASE REALTIME REPLICATION (For live responses & threads)
-- ================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table submissions, threads, thread_messages, votes;
