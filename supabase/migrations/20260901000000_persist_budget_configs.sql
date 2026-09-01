-- Budget configurations persist across months. Existing budgets remain monthly snapshots.

create table if not exists public.budget_configs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric not null check (amount > 0),
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_configs_household_category_uidx unique (household_id, category_id)
);

create index if not exists budget_configs_household_active_idx
  on public.budget_configs (household_id, is_active);

alter table public.budget_configs enable row level security;

revoke all on table public.budget_configs from public, anon, authenticated;

-- Existing monthly rows are retained. The newest row becomes the persistent configuration.
insert into public.budget_configs (
  household_id,
  category_id,
  amount,
  created_by,
  created_at,
  updated_at
)
select distinct on (b.household_id, b.category_id)
  b.household_id,
  b.category_id,
  b.amount,
  b.created_by,
  b.created_at,
  b.updated_at
from public.budgets b
order by b.household_id, b.category_id, b.month desc, b.updated_at desc, b.created_at desc, b.id desc
on conflict (household_id, category_id) do nothing;

create or replace function public.ensure_budget_snapshots(
  p_household_id uuid,
  p_month date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_month is null or date_trunc('month', p_month)::date <> p_month then
    raise exception 'Budget month must be the first day of the month';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Household membership required';
  end if;

  -- Serialize generation for a household/month before using the snapshot unique key.
  perform pg_advisory_xact_lock(
    hashtextextended(p_household_id::text || ':' || p_month::text, 0)
  );

  insert into public.budgets (
    household_id,
    category_id,
    created_by,
    amount,
    month
  )
  select
    config.household_id,
    config.category_id,
    config.created_by,
    config.amount,
    p_month
  from public.budget_configs config
  where config.household_id = p_household_id
    and config.is_active
    and exists (
      select 1
      from public.categories category
      where category.id = config.category_id
        and category.household_id = config.household_id
        and category.type = 'expense'
    )
    and not exists (
      select 1
      from public.budgets existing
      where existing.household_id = config.household_id
        and existing.category_id = config.category_id
        and existing.month = p_month
    )
  on conflict (household_id, category_id, month) do nothing;
end;
$$;

revoke execute on function public.ensure_budget_snapshots(uuid, date) from public, anon;
grant execute on function public.ensure_budget_snapshots(uuid, date) to authenticated;

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
  v_month date;
  v_config public.budget_configs;
  v_budget public.budgets;
  v_category public.categories;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Budget amount must be greater than zero';
  end if;

  if p_month is null or p_month !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Budget month must be a valid ISO date';
  end if;

  v_month := p_month::date;
  if v_month is null or date_trunc('month', v_month)::date <> v_month then
    raise exception 'Budget month must be the first day of the month';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Household membership required';
  end if;

  select * into v_category
  from public.categories
  where id = p_category_id
    and household_id = p_household_id
    and type = 'expense';

  if not found then
    raise exception 'Budget category does not belong to household or is not an expense category';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_household_id::text || ':' || p_category_id::text, 0)
  );

  insert into public.budget_configs (
    household_id,
    category_id,
    amount,
    is_active,
    created_by
  )
  values (
    p_household_id,
    p_category_id,
    p_amount,
    true,
    v_actor_id
  )
  on conflict (household_id, category_id) do update
    set amount = excluded.amount,
        is_active = true,
        updated_at = now()
  returning * into v_config;

  update public.budgets
  set amount = p_amount,
      updated_at = now()
  where household_id = p_household_id
    and category_id = p_category_id
    and month = v_month;

  insert into public.budgets (
    household_id,
    category_id,
    created_by,
    amount,
    month
  )
  select
    v_config.household_id,
    v_config.category_id,
    v_config.created_by,
    v_config.amount,
    v_month
  where not exists (
    select 1
    from public.budgets existing
    where existing.household_id = p_household_id
      and existing.category_id = p_category_id
      and existing.month = v_month
  )
  on conflict (household_id, category_id, month) do nothing;

  select * into v_budget
  from public.budgets
  where household_id = p_household_id
    and category_id = p_category_id
    and month = v_month
  order by created_at desc, id desc
  limit 1;

  if not found then
    raise exception 'Budget snapshot could not be created';
  end if;

  if not exists (
    select 1
    from public.household_activity activity
    where activity.type = 'budget_created'
      and activity.entity_type = 'budget'
      and activity.entity_id = v_budget.id
  ) then
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
  end if;

  return to_jsonb(v_budget) || jsonb_build_object(
    'category', jsonb_build_object(
      'id', v_category.id,
      'name', v_category.name,
      'icon', v_category.icon
    )
  );
end;
$$;

revoke execute on function public.create_budget_with_activity(uuid, uuid, numeric, text) from public, anon;
grant execute on function public.create_budget_with_activity(uuid, uuid, numeric, text) to authenticated;

drop function if exists public.update_budget_with_activity(uuid, numeric);

create function public.update_budget_with_activity(
  p_budget_id uuid,
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
  v_month date;
  v_budget public.budgets;
  v_category public.categories;
  v_previous_amount numeric;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Budget amount must be greater than zero';
  end if;

  if p_month is null or p_month !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Budget month must be a valid ISO date';
  end if;

  v_month := p_month::date;
  if v_month is null or date_trunc('month', v_month)::date <> v_month then
    raise exception 'Budget month must be the first day of the month';
  end if;

  select * into v_budget
  from public.budgets
  where id = p_budget_id
  for update;

  if not found then
    raise exception 'Budget not found';
  end if;

  if v_budget.month <> v_month then
    raise exception 'Only the current month budget can be edited';
  end if;

  if not public.is_household_member(v_budget.household_id) then
    raise exception 'Household membership required';
  end if;

  select * into v_category
  from public.categories
  where id = v_budget.category_id
    and household_id = v_budget.household_id
    and type = 'expense';

  if not found then
    raise exception 'Budget category not found';
  end if;

  v_previous_amount := v_budget.amount;

  update public.budget_configs
  set amount = p_amount,
      is_active = true,
      updated_at = now()
  where household_id = v_budget.household_id
    and category_id = v_budget.category_id;

  if not found then
    raise exception 'Budget configuration not found';
  end if;

  update public.budgets
  set amount = p_amount,
      updated_at = now()
  where id = v_budget.id
    and month = v_month;

  select * into v_budget
  from public.budgets
  where id = p_budget_id;

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
    'budget_updated',
    'budget',
    v_budget.id,
    jsonb_build_object(
      'previousAmount', v_previous_amount,
      'newAmount', v_budget.amount,
      'categoryName', v_category.name,
      'categoryIcon', v_category.icon
    )
  );

  return to_jsonb(v_budget) || jsonb_build_object(
    'category', jsonb_build_object(
      'id', v_category.id,
      'name', v_category.name,
      'icon', v_category.icon
    )
  );
end;
$$;

revoke execute on function public.update_budget_with_activity(uuid, numeric, text) from public, anon;
grant execute on function public.update_budget_with_activity(uuid, numeric, text) to authenticated;

drop function if exists public.delete_budget_with_activity(uuid);

create function public.delete_budget_with_activity(
  p_budget_id uuid,
  p_month text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_month date;
  v_budget public.budgets;
  v_category public.categories;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_month is null or p_month !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Budget month must be a valid ISO date';
  end if;

  v_month := p_month::date;
  if v_month is null or date_trunc('month', v_month)::date <> v_month then
    raise exception 'Budget month must be the first day of the month';
  end if;

  select * into v_budget
  from public.budgets
  where id = p_budget_id
  for update;

  if not found then
    raise exception 'Budget not found';
  end if;

  if v_budget.month <> v_month then
    raise exception 'Only the current month budget can be deleted';
  end if;

  if not public.is_household_member(v_budget.household_id) then
    raise exception 'Household membership required';
  end if;

  select * into v_category
  from public.categories
  where id = v_budget.category_id
    and household_id = v_budget.household_id
    and type = 'expense';

  if not found then
    raise exception 'Budget category not found';
  end if;

  update public.budget_configs
  set is_active = false,
      updated_at = now()
  where household_id = v_budget.household_id
    and category_id = v_budget.category_id;

  if not found then
    raise exception 'Budget configuration not found';
  end if;

  delete from public.budgets
  where id = v_budget.id
    and month = v_month;

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
    'budget_deleted',
    'budget',
    v_budget.id,
    jsonb_build_object(
      'amount', v_budget.amount,
      'categoryName', v_category.name,
      'categoryIcon', v_category.icon
    )
  );
end;
$$;

revoke execute on function public.delete_budget_with_activity(uuid, text) from public, anon;
grant execute on function public.delete_budget_with_activity(uuid, text) to authenticated;
