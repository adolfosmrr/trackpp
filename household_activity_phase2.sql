-- Run this script manually after household_activity.sql.

-- Creation events are one-time events. Updates are intentionally excluded so
-- the same budget can produce any number of budget_updated events.
drop index if exists public.household_activity_created_entity_uidx;

create unique index household_activity_created_entity_uidx
  on public.household_activity (type, entity_type, entity_id)
  where entity_id is not null
    and type in (
      'transaction_created',
      'budget_created',
      'transaction_deleted',
      'budget_deleted'
    );

create or replace function public.update_budget_with_activity(
  p_budget_id uuid,
  p_amount numeric
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
  v_previous_amount numeric;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount <= 0 then
    raise exception 'Budget amount must be greater than zero';
  end if;

  select * into v_budget
    from public.budgets
    where id = p_budget_id
    for update;

  if not found then
    raise exception 'Budget not found';
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

  update public.budgets
    set amount = p_amount,
        updated_at = now()
    where id = v_budget.id;

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

revoke execute on function public.update_budget_with_activity(uuid, numeric)
  from public, anon;
grant execute on function public.update_budget_with_activity(uuid, numeric)
  to authenticated;

create or replace function public.delete_transaction_with_activity(
  p_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_transaction public.transactions;
  v_category public.categories;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_transaction
    from public.transactions
    where id = p_transaction_id
    for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  if not public.is_household_member(v_transaction.household_id) then
    raise exception 'Household membership required';
  end if;

  select * into v_category
    from public.categories
    where id = v_transaction.category_id
      and household_id = v_transaction.household_id;

  delete from public.transactions
    where id = v_transaction.id;

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
    'transaction_deleted',
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
end;
$$;

revoke execute on function public.delete_transaction_with_activity(uuid)
  from public, anon;
grant execute on function public.delete_transaction_with_activity(uuid)
  to authenticated;

create or replace function public.delete_budget_with_activity(
  p_budget_id uuid
)
returns void
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

  select * into v_budget
    from public.budgets
    where id = p_budget_id
    for update;

  if not found then
    raise exception 'Budget not found';
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

  delete from public.budgets
    where id = v_budget.id;

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

revoke execute on function public.delete_budget_with_activity(uuid)
  from public, anon;
grant execute on function public.delete_budget_with_activity(uuid)
  to authenticated;
