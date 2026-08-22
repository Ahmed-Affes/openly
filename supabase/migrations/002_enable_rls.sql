-- Enable RLS on all tables
alter table rooms enable row level security;
alter table questions enable row level security;
alter table submissions enable row level security;
alter table answers enable row level security;
alter table threads enable row level security;
alter table thread_messages enable row level security;
alter table votes enable row level security;
alter table invites enable row level security;
alter table user_settings enable row level security;
