-- Live classroom lifecycle and attendance for the managed LiveKit media plane.

alter table public.live_sessions
  add column if not exists lesson_id uuid references public.lessons(id) on delete set null,
  add column if not exists waiting_room boolean not null default true,
  add column if not exists eligible_audience text not null default 'course_enrolled',
  add column if not exists failure_reason text;

alter table public.live_sessions
  drop constraint if exists live_sessions_status_check;
alter table public.live_sessions
  add constraint live_sessions_status_check
  check (status in ('scheduled', 'live', 'ended', 'cancelled', 'failed'));

alter table public.live_sessions
  drop constraint if exists live_sessions_eligible_audience_check;
alter table public.live_sessions
  add constraint live_sessions_eligible_audience_check
  check (eligible_audience = 'course_enrolled');

alter table public.live_session_attendance
  add column if not exists connected_seconds integer not null default 0,
  add column if not exists attendance_status text not null default 'invited';

alter table public.events
  add column if not exists live_session_id uuid references public.live_sessions(id) on delete cascade;

create table if not exists public.live_session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('tutor', 'student')),
  status text not null default 'invited'
    check (status in ('invited', 'waiting', 'joined', 'left', 'removed')),
  joined_at timestamptz,
  left_at timestamptz,
  last_joined_at timestamptz,
  connected_seconds integer not null default 0 check (connected_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create table if not exists public.session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  provider_event_id text unique,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists live_sessions_host_schedule_idx
  on public.live_sessions(host_id, scheduled_at desc);
create index if not exists live_sessions_course_schedule_idx
  on public.live_sessions(course_id, scheduled_at);
create index if not exists live_session_participants_active_idx
  on public.live_session_participants(session_id, status);
create index if not exists session_events_session_time_idx
  on public.session_events(session_id, occurred_at);
create index if not exists events_live_session_idx
  on public.events(live_session_id)
  where live_session_id is not null;

alter table public.live_session_participants enable row level security;
alter table public.session_events enable row level security;

revoke all on public.live_session_participants from anon, authenticated;
revoke all on public.session_events from anon, authenticated;
grant all on public.live_session_participants to service_role;
grant all on public.session_events to service_role;

create or replace function public.request_live_session_access(
  requested_session_id uuid,
  requested_user_id uuid,
  requested_role text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.live_sessions%rowtype;
  participant_status text;
  occupied integer;
begin
  select * into target
  from public.live_sessions
  where id = requested_session_id
  for update;

  if not found or target.status <> 'live' then
    raise exception 'session_not_live';
  end if;

  select status into participant_status
  from public.live_session_participants
  where session_id = requested_session_id and user_id = requested_user_id;

  if participant_status = 'removed' then
    raise exception 'participant_removed';
  end if;

  if requested_role <> 'tutor' and target.waiting_room
     and participant_status is distinct from 'invited'
     and participant_status is distinct from 'joined' then
    insert into public.live_session_participants
      (session_id, user_id, role, status, updated_at)
    values
      (requested_session_id, requested_user_id, requested_role, 'waiting', now())
    on conflict (session_id, user_id) do update
      set role = excluded.role, status = 'waiting', updated_at = now()
      where public.live_session_participants.status in ('waiting', 'left');
    return 'waiting';
  end if;

  select count(*) into occupied
  from public.live_session_participants
  where session_id = requested_session_id
    and status in ('invited', 'joined')
    and user_id <> requested_user_id;

  if occupied >= target.max_participants then
    raise exception 'session_full';
  end if;

  insert into public.live_session_participants
    (session_id, user_id, role, status, updated_at)
  values
    (requested_session_id, requested_user_id, requested_role, 'invited', now())
  on conflict (session_id, user_id) do update
    set role = excluded.role,
        status = case
          when public.live_session_participants.status = 'joined' then 'joined'
          else 'invited'
        end,
        updated_at = now()
    where public.live_session_participants.status in ('invited', 'joined', 'left');

  return 'invited';
end;
$$;

create or replace function public.admit_live_session_participant(
  requested_session_id uuid,
  requested_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.live_sessions%rowtype;
  occupied integer;
begin
  select * into target
  from public.live_sessions
  where id = requested_session_id
  for update;

  if not found or target.status <> 'live' then
    raise exception 'session_not_live';
  end if;

  select count(*) into occupied
  from public.live_session_participants
  where session_id = requested_session_id
    and status in ('invited', 'joined')
    and user_id <> requested_user_id;

  if occupied >= target.max_participants then
    raise exception 'session_full';
  end if;

  update public.live_session_participants
  set status = 'invited', updated_at = now()
  where session_id = requested_session_id
    and user_id = requested_user_id
    and status = 'waiting';

  return found;
end;
$$;

create or replace function public.remove_live_session_participant(
  requested_session_id uuid,
  requested_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.live_sessions%rowtype;
  updated_participant public.live_session_participants%rowtype;
begin
  select * into target
  from public.live_sessions
  where id = requested_session_id
  for update;

  if not found or target.status <> 'live' then
    return false;
  end if;

  update public.live_session_participants
  set status = 'removed',
      left_at = coalesce(left_at, now()),
      connected_seconds = connected_seconds + case
        when status = 'joined' and last_joined_at is not null
          then greatest(0, floor(extract(epoch from now() - last_joined_at))::integer)
        else 0
      end,
      last_joined_at = null,
      updated_at = now()
  where session_id = requested_session_id
    and user_id = requested_user_id
    and status in ('invited', 'waiting', 'joined', 'left')
  returning * into updated_participant;

  if not found then
    return false;
  end if;

  update public.live_session_attendance
  set left_at = updated_participant.left_at,
      connected_seconds = updated_participant.connected_seconds,
      attendance_status = 'removed'
  where session_id = requested_session_id
    and user_id = requested_user_id;

  return true;
end;
$$;

create or replace function public.record_live_session_event(
  requested_session_id uuid,
  requested_event_id text,
  requested_event_type text,
  requested_actor_id uuid,
  requested_occurred_at timestamptz,
  requested_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event_id uuid;
begin
  insert into public.session_events
    (session_id, actor_id, event_type, occurred_at, provider_event_id, metadata)
  values
    (requested_session_id, requested_actor_id, requested_event_type,
     requested_occurred_at, requested_event_id, coalesce(requested_metadata, '{}'::jsonb))
  on conflict (provider_event_id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    return false;
  end if;

  if requested_event_type = 'participant_joined' and requested_actor_id is not null then
    update public.live_session_participants
    set status = 'joined',
        joined_at = coalesce(joined_at, requested_occurred_at),
        left_at = null,
        last_joined_at = requested_occurred_at,
        updated_at = now()
    where session_id = requested_session_id
      and user_id = requested_actor_id
      and status in ('invited', 'joined', 'left');

    if found then
      insert into public.live_session_attendance
        (session_id, user_id, joined_at, left_at, connected_seconds, attendance_status)
      select session_id, user_id, joined_at, null, connected_seconds, 'joined'
      from public.live_session_participants
      where session_id = requested_session_id and user_id = requested_actor_id
      on conflict (session_id, user_id) do update
        set joined_at = least(public.live_session_attendance.joined_at, excluded.joined_at),
            left_at = null,
            attendance_status = 'joined';
    end if;
  elsif requested_event_type = 'participant_left' and requested_actor_id is not null then
    update public.live_session_participants
    set status = case when status = 'removed' then 'removed' else 'left' end,
        left_at = requested_occurred_at,
        connected_seconds = connected_seconds + case
          when status = 'joined' and last_joined_at is not null
            then greatest(0, floor(extract(epoch from requested_occurred_at - last_joined_at))::integer)
          else 0
        end,
        last_joined_at = null,
        updated_at = now()
    where session_id = requested_session_id
      and user_id = requested_actor_id
      and status in ('joined', 'removed');

    update public.live_session_attendance attendance
    set left_at = participant.left_at,
        connected_seconds = participant.connected_seconds,
        attendance_status = participant.status
    from public.live_session_participants participant
    where attendance.session_id = participant.session_id
      and attendance.user_id = participant.user_id
      and participant.session_id = requested_session_id
      and participant.user_id = requested_actor_id;
  elsif requested_event_type = 'room_finished' then
    update public.live_sessions
    set status = 'failed',
        ended_at = requested_occurred_at,
        failure_reason = 'LiveKit room ended without an application end-class request',
        updated_at = now()
    where id = requested_session_id and status = 'live';

    update public.live_session_participants
    set connected_seconds = connected_seconds + case
          when status = 'joined' and last_joined_at is not null
            then greatest(0, floor(extract(epoch from requested_occurred_at - last_joined_at))::integer)
          else 0
        end,
        left_at = requested_occurred_at,
        last_joined_at = null,
        status = case when status = 'joined' then 'left' else status end,
        updated_at = now()
    where session_id = requested_session_id and status in ('joined', 'removed');

    update public.live_session_attendance attendance
    set left_at = participant.left_at,
        connected_seconds = participant.connected_seconds,
        attendance_status = participant.status
    from public.live_session_participants participant
    where attendance.session_id = participant.session_id
      and attendance.user_id = participant.user_id
      and participant.session_id = requested_session_id;

    delete from public.events where live_session_id = requested_session_id;
  end if;

  return true;
end;
$$;

revoke all on function public.request_live_session_access(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.admit_live_session_participant(uuid, uuid) from public, anon, authenticated;
revoke all on function public.remove_live_session_participant(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_live_session_event(uuid, text, text, uuid, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.request_live_session_access(uuid, uuid, text) to service_role;
grant execute on function public.admit_live_session_participant(uuid, uuid) to service_role;
grant execute on function public.remove_live_session_participant(uuid, uuid) to service_role;
grant execute on function public.record_live_session_event(uuid, text, text, uuid, timestamptz, jsonb) to service_role;
