-- Run once on existing Supabase projects (safe to re-run with IF NOT EXISTS / IF NOT EXISTS columns)

alter table public.lessons
  add column if not exists quiz_title text,
  add column if not exists quiz_num_questions integer,
  add column if not exists quiz_description text,
  add column if not exists assignment_title text,
  add column if not exists assignment_description text,
  add column if not exists assignment_format text;

alter table public.courses
  add column if not exists project_title text,
  add column if not exists project_description text,
  add column if not exists project_instructions text,
  add column if not exists project_format text;

create table if not exists public.assessment_submissions (
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

create index if not exists idx_assessment_submissions_user_course
  on public.assessment_submissions (user_id, course_id);

alter table public.assessment_submissions enable row level security;

drop policy if exists assessment_submissions_select_own on public.assessment_submissions;
create policy assessment_submissions_select_own on public.assessment_submissions
  for select using (auth.uid() = user_id);

drop policy if exists assessment_submissions_insert_own on public.assessment_submissions;
create policy assessment_submissions_insert_own on public.assessment_submissions
  for insert with check (auth.uid() = user_id);

drop policy if exists assessment_submissions_update_own on public.assessment_submissions;
create policy assessment_submissions_update_own on public.assessment_submissions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
