-- Include agent role in staff checks (courses, news, submissions RLS)
create or replace function public.is_staff()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('admin', 'tutor', 'agent')
  );
$$;
