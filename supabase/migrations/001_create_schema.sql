-- Rooms table
create table rooms (
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

-- Questions table
create table questions (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade,
  text text not null,
  order_index int not null,
  created_at timestamptz default now()
);

-- Submissions table (fully anonymous)
create table submissions (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade,
  device_hash text not null,
  created_at timestamptz default now()
);

-- Answers table
create table answers (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references submissions(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  text text,
  reaction_level int check (reaction_level between 1 and 10),
  intensity text check (intensity in ('thought', 'urgent')),
  created_at timestamptz default now()
);

-- Threads table
create table threads (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references submissions(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  is_resolved boolean default false,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

-- Thread messages table
create table thread_messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references threads(id) on delete cascade,
  sender text not null check (sender in ('creator', 'responder')),
  text text not null,
  created_at timestamptz default now()
);

-- Votes table
create table votes (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references submissions(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  device_hash text not null,
  vote_type text check (vote_type in ('up', 'down', 'yes', 'no', 'unsure')),
  created_at timestamptz default now(),
  unique(submission_id, device_hash)
);

-- Invited emails table
create table invites (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade,
  email text not null,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- User settings table
create table user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  email_notifications boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for better performance
create index rooms_creator_id_idx on rooms(creator_id);
create index rooms_status_idx on rooms(status);
create index questions_room_id_idx on questions(room_id);
create index submissions_room_id_idx on submissions(room_id);
create index submissions_device_hash_idx on submissions(device_hash);
create index answers_submission_id_idx on answers(submission_id);
create index answers_question_id_idx on answers(question_id);
create index threads_submission_id_idx on threads(submission_id);
create index threads_room_id_idx on threads(room_id);
create index thread_messages_thread_id_idx on thread_messages(thread_id);
create index votes_submission_id_idx on votes(submission_id);
create index votes_room_id_idx on votes(room_id);
create index invites_room_id_idx on invites(room_id);
