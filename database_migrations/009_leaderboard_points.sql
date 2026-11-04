alter table public.users
  add column if not exists points integer not null default 0;
