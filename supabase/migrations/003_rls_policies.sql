-- Rooms
create policy "Creators manage their rooms"
on rooms for all
using (auth.uid() = creator_id);

create policy "Anyone can view rooms by id"
on rooms for select
using (true);

-- Questions
create policy "Creators manage questions"
on questions for all
using (exists (
  select 1 from rooms
  where rooms.id = questions.room_id
  and rooms.creator_id = auth.uid()
));

create policy "Anyone can read questions"
on questions for select
using (true);

-- Submissions
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

-- Answers
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

-- Threads
create policy "Creators manage threads"
on threads for all
using (exists (
  select 1 from rooms
  where rooms.id = threads.room_id
  and rooms.creator_id = auth.uid()
));

create policy "Anyone can insert threads"
on threads for insert
with check (true);

create policy "Anyone can read threads by submission"
on threads for select
using (true);

-- Thread messages
create policy "Anyone can insert thread messages"
on thread_messages for insert
with check (true);

create policy "Anyone can read thread messages"
on thread_messages for select
using (true);

-- Votes
create policy "Anyone can vote"
on votes for insert
with check (true);

create policy "Creators can read votes"
on votes for select
using (exists (
  select 1 from rooms
  where rooms.id = votes.room_id
  and rooms.creator_id = auth.uid()
));

-- Invites
create policy "Creators manage invites"
on invites for all
using (exists (
  select 1 from rooms
  where rooms.id = invites.room_id
  and rooms.creator_id = auth.uid()
));

-- User settings
create policy "Users manage their own settings"
on user_settings for all
using (auth.uid() = user_id);
