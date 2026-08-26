-- Run this script manually in the Supabase SQL Editor.

create table if not exists public.household_activity_reads (
  user_id uuid not null,
  household_id uuid not null,
  last_seen_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, household_id),
  constraint household_activity_reads_user_id_fkey
    foreign key (user_id)
    references public.profiles(id)
    on delete cascade,
  constraint household_activity_reads_household_id_fkey
    foreign key (household_id)
    references public.households(id)
    on delete cascade
);

alter table public.household_activity_reads enable row level security;

revoke all on table public.household_activity_reads
  from public, anon, authenticated;
grant select, insert, update
  on table public.household_activity_reads
  to authenticated;

drop policy if exists "Users can read their activity state"
  on public.household_activity_reads;

create policy "Users can read their activity state"
  on public.household_activity_reads
  for select
  to authenticated
  using (
    auth.uid() = user_id
    and public.is_household_member(household_id)
  );

drop policy if exists "Users can insert their activity state"
  on public.household_activity_reads;

create policy "Users can insert their activity state"
  on public.household_activity_reads
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_household_member(household_id)
  );

drop policy if exists "Users can update their activity state"
  on public.household_activity_reads;

create policy "Users can update their activity state"
  on public.household_activity_reads
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and public.is_household_member(household_id)
  )
  with check (
    auth.uid() = user_id
    and public.is_household_member(household_id)
  );

create or replace function public.get_unread_household_activity_count(
  p_household_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_seen_at timestamptz;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Household membership required';
  end if;

  -- The first read initializes the baseline and intentionally returns zero.
  insert into public.household_activity_reads (
    user_id,
    household_id,
    last_seen_at
  )
  values (
    v_user_id,
    p_household_id,
    now()
  )
  on conflict (user_id, household_id) do nothing;

  select last_seen_at
    into v_last_seen_at
    from public.household_activity_reads
   where user_id = v_user_id
     and household_id = p_household_id;

  select count(*)::integer
    into v_count
    from public.household_activity
   where household_id = p_household_id
     and created_at > v_last_seen_at
     and (actor_id is null or actor_id <> v_user_id);

  return v_count;
end;
$$;

revoke execute on function public.get_unread_household_activity_count(uuid)
  from public;
grant execute on function public.get_unread_household_activity_count(uuid)
  to authenticated;

create or replace function public.mark_household_activity_seen(
  p_household_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_seen_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Household membership required';
  end if;

  insert into public.household_activity_reads (
    user_id,
    household_id,
    last_seen_at,
    updated_at
  )
  values (
    v_user_id,
    p_household_id,
    v_seen_at,
    v_seen_at
  )
  on conflict (user_id, household_id) do update
    set last_seen_at = excluded.last_seen_at,
        updated_at = excluded.updated_at;

  return v_seen_at;
end;
$$;

revoke execute on function public.mark_household_activity_seen(uuid)
  from public;
grant execute on function public.mark_household_activity_seen(uuid)
  to authenticated;
