-- Run this in Supabase SQL Editor

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  username text unique,
  display_name text,
  photo_url text,
  role text check (role in ('user', 'admin', 'parent', 'student', 'wydawca')) default 'user',
  school_class text,
  selected_levels text[],
  is_premium boolean default false,
  streak integer default 0,
  last_active_date date,
  total_time_spent integer default 0,
  parent_email text,
  parent_uid uuid references public.users(id),
  children_uids uuid[],
  weak_topics text[],
  total_points integer default 0,
  notification_frequency text default 'none',
  alert_on_missing_login boolean default false,
  completed_study_topics text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own profile." on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile." on public.users
  for update using (auth.uid() = id);

create policy "Parents can view their children." on public.users
  for select using (auth.uid() = parent_uid);

create policy "Admins can view all users." on public.users
  for select using (
    exists (
      select 1 from public.users where id = auth.uid() and role = 'admin'
    )
  );

-- Progress table
create table public.lesson_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  lesson_id text not null,
  status text check (status in ('not-started', 'in-progress', 'completed')) default 'not-started',
  score integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy "Users can view their own progress." on public.lesson_progress
  for select using (auth.uid() = user_id);

create policy "Users can update their own progress." on public.lesson_progress
  for all using (auth.uid() = user_id);

-- Lessons table
create table public.lessons (
  id text primary key,
  week integer not null,
  topic text not null,
  scope text[],
  content text,
  video_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lessons enable row level security;

create policy "Anyone can view lessons." on public.lessons
  for select using (true);

create policy "Only admins can modify lessons." on public.lessons
  for all using (
    exists (
      select 1 from public.users where id = auth.uid() and role = 'admin'
    )
  );

-- Quizzes table
create table public.quizzes (
  lesson_id text primary key references public.lessons(id) on delete cascade,
  title text not null,
  questions jsonb not null default '[]'::jsonb
);

alter table public.quizzes enable row level security;

create policy "Anyone can view quizzes." on public.quizzes
  for select using (true);

create policy "Only admins can modify quizzes." on public.quizzes
  for all using (
    exists (
      select 1 from public.users where id = auth.uid() and role = 'admin'
    )
  );

-- Questions table (for general revision questions)
create table public.questions (
  id text primary key,
  text text not null,
  options text[] not null,
  correct_answer integer not null,
  explanation text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  week integer not null,
  topic_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.questions enable row level security;

create policy "Anyone can view questions." on public.questions
  for select using (true);

create policy "Only admins can modify questions." on public.questions
  for all using (
    exists (
      select 1 from public.users where id = auth.uid() and role = 'admin'
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'user'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
