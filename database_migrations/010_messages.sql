create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 5000),
  created_at timestamptz not null default now(),
  read boolean not null default false,
  constraint messages_sender_receiver_differ check (sender_id <> receiver_id)
);

create index if not exists messages_sender_receiver_created_at_idx
  on public.messages (sender_id, receiver_id, created_at);

create index if not exists messages_receiver_sender_created_at_idx
  on public.messages (receiver_id, sender_id, created_at);

alter table public.messages enable row level security;
grant select, insert on public.messages to authenticated;

drop policy if exists messages_select_participants on public.messages;
create policy messages_select_participants on public.messages
  for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and receiver_id <> auth.uid());

revoke insert on public.messages from authenticated;
grant insert (sender_id, receiver_id, text) on public.messages to authenticated;

drop policy if exists messages_update_receiver_read on public.messages;
create policy messages_update_receiver_read on public.messages
  for update to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

revoke update on public.messages from authenticated;
grant update (read) on public.messages to authenticated;
