-- =====================================================================
-- Nexus Hub - Production database schema
-- Run this in your Supabase SQL Editor.
--
-- WARNING: This script DROPS and recreates the application tables in the
-- `public` schema (courses, enrollments, payments, etc.). It is intended for
-- a pre-launch reset where existing rows are test data only. It does NOT
-- touch `auth.users`. Existing auth accounts are backfilled into public.users
-- at the end.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Drop old objects (safe re-run)
-- ---------------------------------------------------------------------
drop table if exists public.assessment_submissions cascade;
drop table if exists public.lesson_progress cascade;
drop table if exists public.user_courses cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.certificates cascade;
drop table if exists public.payments cascade;
drop table if exists public.orders cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversation_participants cascade;
drop table if exists public.conversations cascade;
drop table if exists public.notes cascade;
drop table if exists public.events cascade;
drop table if exists public.course_materials cascade;
drop table if exists public.lessons cascade;
drop table if exists public.courses cascade;
drop table if exists public.contact_submissions cascade;
drop table if exists public.suggestions cascade;
drop table if exists public.newsletter_subscribers cascade;
drop table if exists public.news cascade;
drop table if exists public.testimonials cascade;
drop table if exists public.programs cascade;
drop table if exists public.live_session_attendance cascade;
drop table if exists public.live_sessions cascade;
drop table if exists public.user_subscriptions cascade;
drop table if exists public.subscription_plans cascade;

-- ---------------------------------------------------------------------
-- Helper functions for RLS
-- ---------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('admin', 'tutor')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Users (profile mirror of auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar(255) unique not null,
  name varchar(255),
  avatar text,
  bio text,
  role varchar(50) not null default 'student' check (role in ('student', 'tutor', 'admin')),
  enrolled_courses text[] default '{}',
  completed_courses text[] default '{}',
  course_progress jsonb default '{}',
  points integer not null default 0,
  streak integer not null default 0,
  last_activity_date timestamptz,
  notification_prefs jsonb default '{}',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Courses / lessons / materials
-- ---------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  category text,
  instructor text,
  instructor_id uuid references public.users(id) on delete set null,
  price numeric(10,2) not null default 0,
  earnings_potential numeric(10,2),
  image text,
  level text,
  duration text,
  rating numeric(2,1) default 0,
  students_count integer default 0,
  lessons_count integer default 0,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  project_title text,
  project_description text,
  project_instructions text,
  project_format text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null default 1,
  week integer,
  title text not null,
  topics jsonb default '[]',
  video_url text,
  video_title text,
  video_duration text,
  duration text,
  quiz_title text,
  quiz_num_questions integer,
  quiz_description text,
  assignment_title text,
  assignment_description text,
  assignment_format text,
  created_at timestamptz default now()
);

create table public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  kind text not null check (kind in ('quiz', 'assignment', 'project')),
  ref_key text not null,
  body jsonb not null default '{}',
  submitted_at timestamptz default now(),
  unique (user_id, ref_key)
);

create table public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null,
  url text not null,
  type text default 'link',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Enrollment & progress
-- ---------------------------------------------------------------------
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  progress integer not null default 0,
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

create table public.lesson_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (user_id, lesson_id)
);

-- ---------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  course_id text not null, -- single course UUID or comma-separated UUIDs
  reference varchar(255) unique not null,
  amount numeric(10,2) not null,
  status varchar(50) not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  amount numeric(10,2) not null,
  reference varchar(255),
  status varchar(50) not null default 'success' check (status in ('success', 'failed', 'refunded')),
  payment_method varchar(50) default 'paystack',
  paid_at timestamptz default now(),
  created_at timestamptz default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  certificate_no text unique not null,
  issued_at timestamptz default now(),
  unique (user_id, course_id)
);

-- ---------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz default now(),
  last_message_at timestamptz default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

-- ---------------------------------------------------------------------
-- Notes & schedule
-- ---------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text,
  type text default 'event' check (type in ('event', 'deadline', 'live', 'reminder')),
  start_at timestamptz not null,
  end_at timestamptz,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Forms
-- ---------------------------------------------------------------------
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz default now()
);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  name text,
  email text,
  category text,
  message text not null,
  created_at timestamptz default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Editorial content (admin managed)
-- ---------------------------------------------------------------------
create table public.news (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text,
  image text,
  author text,
  category text,
  published boolean not null default true,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  company text,
  avatar text,
  quote text not null,
  rating integer default 5,
  featured boolean not null default true,
  created_at timestamptz default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  duration text,
  level text,
  price numeric(10,2) default 0,
  image text,
  students_count integer default 0,
  featured boolean not null default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Subscription plans & live classroom
-- ---------------------------------------------------------------------
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
  feature_flags jsonb not null default '{}',
  role_upgrade text check (role_upgrade in ('tutor', 'agent')),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'past_due')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  paystack_reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text,
  room_name text unique not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended', 'cancelled')),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  max_participants integer not null default 50,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.live_session_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz,
  unique (session_id, user_id)
);

insert into public.subscription_plans (slug, name, description, price, feature_flags, role_upgrade, sort_order)
values
  (
    'learner_plus',
    'Learner Plus',
    'Join live classes, certificates, and offline downloads.',
    4500,
    '{"live_classroom":false,"live_classroom_join":true,"max_courses":0,"premium_analytics":false,"agency_dashboard":false,"priority_support":true,"certificates":true,"offline_downloads":true}'::jsonb,
    null,
    0
  ),
  (
    'learner_pro',
    'Learner Pro',
    'Premium learning with mentor support and advanced analytics.',
    8500,
    '{"live_classroom":false,"live_classroom_join":true,"max_courses":0,"premium_analytics":true,"agency_dashboard":false,"priority_support":true,"certificates":true,"offline_downloads":true}'::jsonb,
    null,
    0
  ),
  (
    'tutor',
    'Tutor',
    'Start teaching with course builder and analytics.',
    12000,
    '{"live_classroom":false,"max_courses":5,"premium_analytics":false,"agency_dashboard":false,"priority_support":false}'::jsonb,
    'tutor',
    1
  ),
  (
    'tutor_plus',
    'Tutor Plus',
    'Includes Nexus Live Classroom and unlimited courses.',
    22000,
    '{"live_classroom":true,"max_courses":-1,"premium_analytics":true,"agency_dashboard":false,"priority_support":true}'::jsonb,
    'tutor',
    2
  ),
  (
    'agent',
    'Agent',
    'Agency dashboard with full live classroom access.',
    45000,
    '{"live_classroom":true,"max_courses":-1,"premium_analytics":true,"agency_dashboard":true,"priority_support":true}'::jsonb,
    'agent',
    3
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  feature_flags = excluded.feature_flags,
  role_upgrade = excluded.role_upgrade,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists idx_lessons_course on public.lessons(course_id);
create index if not exists idx_materials_course on public.course_materials(course_id);
create index if not exists idx_enrollments_user on public.enrollments(user_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);
create index if not exists idx_lesson_progress_user on public.lesson_progress(user_id);
create index if not exists idx_assessment_submissions_user_course
  on public.assessment_submissions (user_id, course_id);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_reference on public.orders(reference);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_participants_user on public.conversation_participants(user_id);
create index if not exists idx_notes_user on public.notes(user_id);
create index if not exists idx_events_user on public.events(user_id);
create index if not exists idx_user_subscriptions_user on public.user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_status on public.user_subscriptions(status);
create index if not exists idx_live_sessions_host on public.live_sessions(host_id);
create index if not exists idx_live_sessions_course on public.live_sessions(course_id);
create index if not exists idx_live_sessions_scheduled on public.live_sessions(scheduled_at);
create index if not exists idx_live_attendance_session on public.live_session_attendance(session_id);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_notes_updated on public.notes;
create trigger trg_notes_updated before update on public.notes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_subscriptions_updated on public.user_subscriptions;
create trigger trg_user_subscriptions_updated before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_live_sessions_updated on public.live_sessions;
create trigger trg_live_sessions_updated before update on public.live_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- New-user trigger (auto-create profile)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, name, avatar, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.course_materials enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.assessment_submissions enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.certificates enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notes enable row level security;
alter table public.events enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.suggestions enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.news enable row level security;
alter table public.testimonials enable row level security;
alter table public.programs enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.live_sessions enable row level security;
alter table public.live_session_attendance enable row level security;

-- Users: read all profiles (needed for leaderboard/messaging display), edit own
drop policy if exists users_select on public.users;
create policy users_select on public.users for select using (true);
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users for update using (id = auth.uid());

-- Courses: public can read published; staff manage all
drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses for select using (status = 'published' or public.is_staff());
drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses for all using (public.is_staff()) with check (public.is_staff());

-- Lessons / materials: readable by anyone (course gating happens in UI), staff manage
drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons for select using (true);
drop policy if exists lessons_write on public.lessons;
create policy lessons_write on public.lessons for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists materials_select on public.course_materials;
create policy materials_select on public.course_materials for select using (true);
drop policy if exists materials_write on public.course_materials;
create policy materials_write on public.course_materials for all using (public.is_staff()) with check (public.is_staff());

-- Enrollments / lesson_progress: own rows only
drop policy if exists enrollments_own on public.enrollments;
create policy enrollments_own on public.enrollments for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists lesson_progress_own on public.lesson_progress;
create policy lesson_progress_own on public.lesson_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists assessment_submissions_select_own on public.assessment_submissions;
create policy assessment_submissions_select_own on public.assessment_submissions
  for select using (auth.uid() = user_id);
drop policy if exists assessment_submissions_insert_own on public.assessment_submissions;
create policy assessment_submissions_insert_own on public.assessment_submissions
  for insert with check (auth.uid() = user_id);
drop policy if exists assessment_submissions_update_own on public.assessment_submissions;
create policy assessment_submissions_update_own on public.assessment_submissions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders / payments / certificates: own rows (writes happen via service role)
drop policy if exists orders_own on public.orders;
create policy orders_own on public.orders for select using (user_id = auth.uid());
drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders for insert with check (user_id = auth.uid());
drop policy if exists payments_own on public.payments;
create policy payments_own on public.payments for select using (user_id = auth.uid());
drop policy if exists certificates_own on public.certificates;
create policy certificates_own on public.certificates for select using (user_id = auth.uid());

-- Conversations / participants / messages
drop policy if exists conversations_member on public.conversations;
create policy conversations_member on public.conversations for select using (
  exists (select 1 from public.conversation_participants p where p.conversation_id = id and p.user_id = auth.uid())
);
drop policy if exists participants_self on public.conversation_participants;
create policy participants_self on public.conversation_participants for select using (
  exists (select 1 from public.conversation_participants p where p.conversation_id = conversation_id and p.user_id = auth.uid())
);
drop policy if exists messages_member_select on public.messages;
create policy messages_member_select on public.messages for select using (
  exists (select 1 from public.conversation_participants p where p.conversation_id = messages.conversation_id and p.user_id = auth.uid())
);
drop policy if exists messages_member_insert on public.messages;
create policy messages_member_insert on public.messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversation_participants p where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()
  )
);

-- Notes / events: own rows only
drop policy if exists notes_own on public.notes;
create policy notes_own on public.notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists events_own on public.events;
create policy events_own on public.events for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Forms: anyone may submit; only staff may read
drop policy if exists contact_insert on public.contact_submissions;
create policy contact_insert on public.contact_submissions for insert with check (true);
drop policy if exists contact_read on public.contact_submissions;
create policy contact_read on public.contact_submissions for select using (public.is_staff());

drop policy if exists suggestions_insert on public.suggestions;
create policy suggestions_insert on public.suggestions for insert with check (true);
drop policy if exists suggestions_read on public.suggestions;
create policy suggestions_read on public.suggestions for select using (public.is_staff());

drop policy if exists newsletter_insert on public.newsletter_subscribers;
create policy newsletter_insert on public.newsletter_subscribers for insert with check (true);
drop policy if exists newsletter_read on public.newsletter_subscribers;
create policy newsletter_read on public.newsletter_subscribers for select using (public.is_staff());

-- Editorial content: public read (published), staff manage
drop policy if exists news_select on public.news;
create policy news_select on public.news for select using (published or public.is_staff());
drop policy if exists news_write on public.news;
create policy news_write on public.news for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists testimonials_select on public.testimonials;
create policy testimonials_select on public.testimonials for select using (true);
drop policy if exists testimonials_write on public.testimonials;
create policy testimonials_write on public.testimonials for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists programs_select on public.programs;
create policy programs_select on public.programs for select using (true);
drop policy if exists programs_write on public.programs;
create policy programs_write on public.programs for all using (public.is_staff()) with check (public.is_staff());

-- Subscription plans: public read
drop policy if exists subscription_plans_select on public.subscription_plans;
create policy subscription_plans_select on public.subscription_plans for select using (active = true or public.is_admin());

-- User subscriptions: own rows
drop policy if exists user_subscriptions_own on public.user_subscriptions;
create policy user_subscriptions_own on public.user_subscriptions for select using (user_id = auth.uid());

-- Live sessions: host, enrolled students, or staff
drop policy if exists live_sessions_select on public.live_sessions;
create policy live_sessions_select on public.live_sessions for select using (
  host_id = auth.uid()
  or public.is_staff()
  or (
    course_id is not null and exists (
      select 1 from public.enrollments e
      where e.course_id = live_sessions.course_id and e.user_id = auth.uid()
    )
  )
);
drop policy if exists live_sessions_insert on public.live_sessions;
create policy live_sessions_insert on public.live_sessions for insert with check (host_id = auth.uid());
drop policy if exists live_sessions_update on public.live_sessions;
create policy live_sessions_update on public.live_sessions for update using (host_id = auth.uid());

-- Attendance: participants record own join
drop policy if exists live_attendance_select on public.live_session_attendance;
create policy live_attendance_select on public.live_session_attendance for select using (
  user_id = auth.uid()
  or exists (select 1 from public.live_sessions s where s.id = session_id and s.host_id = auth.uid())
);
drop policy if exists live_attendance_insert on public.live_session_attendance;
create policy live_attendance_insert on public.live_session_attendance for insert with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Backfill profiles for existing auth users
-- ---------------------------------------------------------------------
insert into public.users (id, email, name, role)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), 'student'
from auth.users u
on conflict (id) do nothing;

-- To grant yourself admin access after running this:
--   update public.users set role = 'admin' where email = 'you@example.com';
