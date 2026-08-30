alter table public.transactions
  add column if not exists linked_group_id uuid null;

create index if not exists transactions_linked_group_id_idx
  on public.transactions (linked_group_id);

create or replace function public.create_linked_transactions(
  p_type text,
  p_title text,
  p_amount numeric,
  p_description text default null,
  p_transaction_date date default current_date,
  p_targets jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_target jsonb;
  v_household_id uuid;
  v_category_id uuid;
  v_linked_group_id uuid;
  v_target_count integer;
  v_transaction public.transactions;
  v_category public.categories;
  v_actor_profile public.profiles;
  v_results jsonb := '[]'::jsonb;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_type not in ('expense', 'income') then
    raise exception 'Invalid transaction type';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception 'Transaction title is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Transaction amount must be greater than zero';
  end if;

  if p_targets is null or jsonb_typeof(p_targets) <> 'array' then
    raise exception 'Transaction targets must be a JSON array';
  end if;

  v_target_count := jsonb_array_length(p_targets);
  if v_target_count = 0 then
    raise exception 'At least one transaction target is required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_targets) as target
    where jsonb_typeof(target) <> 'object'
      or nullif(trim(target->>'householdId'), '') is null
  ) then
    raise exception 'Each transaction target requires a householdId';
  end if;

  if exists (
    select target->>'householdId'
    from jsonb_array_elements(p_targets) as target
    group by target->>'householdId'
    having count(*) > 1
  ) then
    raise exception 'Transaction targets cannot contain duplicate households';
  end if;

  if v_target_count > 1 then
    v_linked_group_id := gen_random_uuid();
  end if;

  select * into v_actor_profile
  from public.profiles
  where id = v_actor_id;

  for v_target in
    select value from jsonb_array_elements(p_targets)
  loop
    v_household_id := (v_target->>'householdId')::uuid;
    v_category_id := null;

    if v_target->>'categoryId' is not null then
      v_category_id := (v_target->>'categoryId')::uuid;
    end if;

    if not exists (
      select 1
      from public.households
      where id = v_household_id
    ) then
      raise exception 'Household does not exist';
    end if;

    if not public.is_household_member(v_household_id) then
      raise exception 'Household membership required';
    end if;

    if v_category_id is not null and not exists (
      select 1
      from public.categories c
      where c.id = v_category_id
        and c.household_id = v_household_id
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
      transaction_date,
      linked_group_id
    )
    values (
      v_household_id,
      v_actor_id,
      p_type,
      trim(p_title),
      p_description,
      p_amount,
      v_category_id,
      p_transaction_date,
      v_linked_group_id
    )
    returning * into v_transaction;

    v_category := null;
    if v_category_id is not null then
      select * into v_category
      from public.categories
      where id = v_category_id
        and household_id = v_household_id;
    end if;

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
        'categoryIcon', v_category.icon,
        'linked_group_id', v_transaction.linked_group_id
      )
    );

    v_results := v_results || jsonb_build_array(
      to_jsonb(v_transaction) || jsonb_build_object(
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
      )
    );
  end loop;

  return v_results;
end;
$$;

revoke execute on function public.create_linked_transactions(
  text, text, numeric, text, date, jsonb
) from public;

grant execute on function public.create_linked_transactions(
  text, text, numeric, text, date, jsonb
) to authenticated;
