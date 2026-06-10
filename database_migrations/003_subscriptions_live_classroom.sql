-- Incremental migration: subscriptions + live classroom
-- Run in Supabase SQL Editor if you already applied an older database_setup.sql

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  billing_interval text not null default 'month',
  feature_flags jsonb not null default '{}',
  role_upgrade text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  paystack_reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text,
  room_name text unique not null,
  status text not null default 'scheduled',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  max_participants integer not null default 50,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.live_session_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz,
  unique (session_id, user_id)
);

insert into public.subscription_plans (slug, name, description, price, feature_flags, role_upgrade, sort_order)
values
  ('tutor', 'Tutor', 'Start teaching with course builder and analytics.', 12000,
   '{"live_classroom":false,"max_courses":5}'::jsonb, 'tutor', 1),
  ('tutor_plus', 'Tutor Plus', 'Includes Nexus Live Classroom.', 22000,
   '{"live_classroom":true,"max_courses":-1}'::jsonb, 'tutor', 2),
  ('agent', 'Agent', 'Agency dashboard with live classroom.', 45000,
   '{"live_classroom":true,"max_courses":-1}'::jsonb, 'agent', 3)
on conflict (slug) do nothing;
