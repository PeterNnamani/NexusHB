-- Migrate legacy agent accounts to admin and remove agent from role constraint.

update public.users set role = 'admin' where role = 'agent';

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('student', 'tutor', 'admin'));

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
