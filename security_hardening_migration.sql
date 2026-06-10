-- Security hardening migration (run once in Supabase SQL Editor after database_setup.sql)
-- Safe to re-run: uses CREATE OR REPLACE and DROP POLICY IF EXISTS

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.is_enrolled_in_course(course_uuid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.enrollments
    where user_id = auth.uid()
      and course_id = course_uuid
      and status in ('active', 'completed')
  );
$$;

create or replace function public.can_access_course_content(course_uuid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    public.is_staff()
    or public.is_enrolled_in_course(course_uuid)
    or exists (
      select 1 from public.courses c
      where c.id = course_uuid and c.instructor_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Users: own row + staff only (no world-readable PII)
-- ---------------------------------------------------------------------------
drop policy if exists users_select on public.users;
drop policy if exists users_select_own on public.users;
drop policy if exists users_select_staff on public.users;

create policy users_select_own on public.users
  for select using (id = auth.uid());

create policy users_select_staff on public.users
  for select using (public.is_staff());

-- ---------------------------------------------------------------------------
-- Lessons & materials: enrolled learners, course instructors, or staff
-- ---------------------------------------------------------------------------
drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons
  for select using (public.can_access_course_content(course_id));

drop policy if exists materials_select on public.course_materials;
create policy materials_select on public.course_materials
  for select using (public.can_access_course_content(course_id));

-- ---------------------------------------------------------------------------
-- Enrollments: users may read/update own rows; inserts via service role only
-- ---------------------------------------------------------------------------
drop policy if exists enrollments_own on public.enrollments;
drop policy if exists enrollments_select_own on public.enrollments;
drop policy if exists enrollments_update_own on public.enrollments;

create policy enrollments_select_own on public.enrollments
  for select using (user_id = auth.uid());

create policy enrollments_update_own on public.enrollments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
