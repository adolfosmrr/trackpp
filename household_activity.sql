-- Run this script manually in the Supabase SQL Editor.

create table if not exists public.household_activity (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  actor_id uuid null,
  type text not null,
  entity_type text null,
  entity_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint household_activity_household_id_fkey
    foreign key (household_id)
    references public.households(id)
    on delete cascade,
  constraint household_activity_actor_id_fkey
    foreign key (actor_id)
    references public.profiles(id)
    on delete set null,
  constraint household_activity_type_check
    check (type in (
      'transaction_created',
      'budget_created',
      'budget_updated',
      'transaction_deleted',
      'budget_deleted',
      'member_joined'
    ))
);

alter table public.household_activity enable row level security;

drop policy if exists "Household members can read activity"
  on public.household_activity;

create policy "Household members can read activity"
  on public.household_activity
  for select
  to authenticated
  using (public.is_household_member(household_id));

create index if not exists household_activity_household_created_at_idx
  on public.household_activity (household_id, created_at desc);

create index if not exists household_activity_entity_idx
  on public.household_activity (entity_type, entity_id);

create unique index if not exists household_activity_created_entity_uidx
  on public.household_activity (type, entity_type, entity_id)
  where entity_id is not null
    and type in ('transaction_created', 'budget_created');

revoke all on table public.household_activity from public, anon, authenticated;
grant select on table public.household_activity to authenticated;

create or replace function public.create_transaction_with_activity(
  p_household_id uuid,
  p_type text,
  p_title text,
  p_amount numeric,
  p_description text default null,
  p_category_id uuid default null,
  p_transaction_date date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_transaction public.transactions;
  v_category public.categories;
  v_actor_profile public.profiles;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Household membership required';
  end if;

  if p_type not in ('expense', 'income') then
    raise exception 'Invalid transaction type';
  end if;

  if p_category_id is not null and not exists (
    select 1
    from public.categories c
    where c.id = p_category_id
      and c.household_id = p_household_id
      and c.type = p_type
  ) then
    raise exception 'Category does not belong to household or transaction type';
  end if;

  insert into public.transactions (
    household_id,
    created_by,
    type,
    title,
    description,
    amount,
    category_id,
    transaction_date
  )
  values (
    p_household_id,
    v_actor_id,
    p_type,
    p_title,
    p_description,
    p_amount,
    p_category_id,
    p_transaction_date
  )
  returning * into v_transaction;

  select * into v_category
    from public.categories
    where id = v_transaction.category_id
      and household_id = v_transaction.household_id;

  select * into v_actor_profile
    from public.profiles
    where id = v_actor_id;

  insert into public.household_activity (
    household_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_transaction.household_id,
    v_actor_id,
    'transaction_created',
    'transaction',
    v_transaction.id,
    jsonb_build_object(
      'title', v_transaction.title,
      'amount', v_transaction.amount,
      'transactionType', v_transaction.type,
      'categoryName', v_category.name,
      'categoryIcon', v_category.icon
    )
  );

  return to_jsonb(v_transaction) || jsonb_build_object(
    'category', case
      when v_category.id is null then null
      else jsonb_build_object(
        'id', v_category.id,
        'name', v_category.name,
        'icon', v_category.icon
      )
    end,
    'creator', case
      when v_actor_profile.id is null then null
      else jsonb_build_object(
        'id', v_actor_profile.id,
        'name', v_actor_profile.name,
        'avatar_url', v_actor_profile.avatar_url
      )
    end
  );
end;
$$;

revoke execute on function public.create_transaction_with_activity(
  uuid, text, text, numeric, text, uuid, date
) from public;
grant execute on function public.create_transaction_with_activity(
  uuid, text, text, numeric, text, uuid, date
) to authenticated;

create or replace function public.create_budget_with_activity(
  p_household_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_month text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_budget public.budgets;
  v_category public.categories;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Household membership required';
  end if;

  if not exists (
    select 1
    from public.categories c
    where c.id = p_category_id
      and c.household_id = p_household_id
      and c.type = 'expense'
  ) then
    raise exception 'Budget category does not belong to household or is not an expense category';
  end if;

  insert into public.budgets (
    household_id,
    category_id,
    created_by,
    amount,
    month
  )
  values (
    p_household_id,
    p_category_id,
    v_actor_id,
    p_amount,
    p_month
  )
  returning * into v_budget;

  select * into v_category
    from public.categories
    where id = v_budget.category_id
      and household_id = v_budget.household_id
      and type = 'expense';

  insert into public.household_activity (
    household_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_budget.household_id,
    v_actor_id,
    'budget_created',
    'budget',
    v_budget.id,
    jsonb_build_object(
      'amount', v_budget.amount,
      'categoryName', v_category.name,
      'categoryIcon', v_category.icon
    )
  );

  return to_jsonb(v_budget) || jsonb_build_object(
    'category', case
      when v_category.id is null then null
      else jsonb_build_object(
        'id', v_category.id,
        'name', v_category.name,
        'icon', v_category.icon
      )
    end
  );
end;
$$;

revoke execute on function public.create_budget_with_activity(
  uuid, uuid, numeric, text
) from public;
grant execute on function public.create_budget_with_activity(
  uuid, uuid, numeric, text
) to authenticated;

-- Optional idempotent backfill for existing records. It only creates
-- *_created events and never modifies or deletes existing data.
insert into public.household_activity (
  household_id,
  actor_id,
  type,
  entity_type,
  entity_id,
  metadata,
  created_at
)
select
  t.household_id,
  t.created_by,
  'transaction_created',
  'transaction',
  t.id,
  jsonb_build_object(
    'title', t.title,
    'amount', t.amount,
    'transactionType', t.type,
    'categoryName', c.name,
    'categoryIcon', c.icon
  ),
  t.created_at
from public.transactions t
left join public.categories c on c.id = t.category_id
where not exists (
  select 1
  from public.household_activity a
  where a.type = 'transaction_created'
    and a.entity_type = 'transaction'
    and a.entity_id = t.id
)
on conflict do nothing;

insert into public.household_activity (
  household_id,
  actor_id,
  type,
  entity_type,
  entity_id,
  metadata,
  created_at
)
select
  b.household_id,
  b.created_by,
  'budget_created',
  'budget',
  b.id,
  jsonb_build_object(
    'amount', b.amount,
    'categoryName', c.name,
    'categoryIcon', c.icon
  ),
  b.created_at
from public.budgets b
left join public.categories c on c.id = b.category_id
where not exists (
  select 1
  from public.household_activity a
  where a.type = 'budget_created'
    and a.entity_type = 'budget'
    and a.entity_id = b.id
)
on conflict do nothing;
