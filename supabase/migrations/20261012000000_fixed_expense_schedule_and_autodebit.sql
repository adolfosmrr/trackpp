-- Additive migration. Do not recreate households, transactions, or existing
-- fixed-expense rows. Existing expenses stay monthly, without auto debit, and
-- keep the amounts already stored on each period.
--
-- Not applied to the remote project from this change. Apply this file once,
-- together with the app build that reads the new columns.
--
-- Amount match tolerance for an automatic debit is 5% of the period's expected
-- amount. The charge date must fall between that period's charge date and due
-- date. A match is only a suggestion: nothing is paid until the user confirms.

alter table public.fixed_expenses
  add column frequency text not null default 'monthly',
  add column auto_debit boolean not null default false,
  add column auto_debit_source text null;

alter table public.fixed_expenses
  add constraint fixed_expenses_frequency_check
    check (frequency in ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual')),
  add constraint fixed_expenses_auto_debit_check
    check (
      (auto_debit = false and auto_debit_source is null)
      or (
        auto_debit = true
        and auto_debit_source in ('naranja', 'galicia', 'other')
      )
    );

create index fixed_expenses_auto_debit_idx
  on public.fixed_expenses (household_id)
  where auto_debit and is_active;

create table public.fixed_expense_amount_changes (
  id uuid primary key default gen_random_uuid(),
  fixed_expense_id uuid not null,
  household_id uuid not null,
  effective_period date not null,
  amount numeric not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint fixed_expense_amount_changes_expense_fkey
    foreign key (fixed_expense_id)
    references public.fixed_expenses (id)
    on delete cascade,
  constraint fixed_expense_amount_changes_household_fkey
    foreign key (household_id)
    references public.households (id)
    on delete cascade,
  constraint fixed_expense_amount_changes_created_by_fkey
    foreign key (created_by)
    references public.profiles (id)
    on delete cascade,
  constraint fixed_expense_amount_changes_expense_period_key
    unique (fixed_expense_id, effective_period),
  constraint fixed_expense_amount_changes_amount_check
    check (amount > 0),
  constraint fixed_expense_amount_changes_period_check
    check (effective_period = date_trunc('month', effective_period)::date)
);

create index fixed_expense_amount_changes_expense_period_idx
  on public.fixed_expense_amount_changes (fixed_expense_id, effective_period desc);

alter table public.fixed_expense_amount_changes enable row level security;

create policy "Household members can read fixed expense amount changes"
  on public.fixed_expense_amount_changes
  for select
  to authenticated
  using (public.is_household_member(household_id));

revoke all on table public.fixed_expense_amount_changes from public, anon, authenticated;
grant select on table public.fixed_expense_amount_changes to authenticated;
grant all on table public.fixed_expense_amount_changes to service_role;

insert into public.fixed_expense_amount_changes (
  fixed_expense_id,
  household_id,
  effective_period,
  amount,
  created_by
)
select
  expense.id,
  expense.household_id,
  date_trunc('month', expense.created_at)::date,
  expense.amount,
  expense.created_by
from public.fixed_expenses expense
on conflict (fixed_expense_id, effective_period) do nothing;

alter table public.pending_bank_charges
  add column suggested_period_id uuid null;

alter table public.pending_bank_charges
  add constraint pending_bank_charges_suggested_period_id_fkey
    foreign key (suggested_period_id)
    references public.fixed_expense_periods (id)
    on delete set null;

create or replace function public.fixed_expense_period_applies(
  p_created_at timestamptz,
  p_frequency text,
  p_period date
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_period = date_trunc('month', p_period)::date
    and p_period >= date_trunc('month', p_created_at)::date
    and mod(
      (
        extract(year from p_period)::integer * 12
        + extract(month from p_period)::integer
      ) - (
        extract(year from p_created_at)::integer * 12
        + extract(month from p_created_at)::integer
      ),
      case p_frequency
        when 'bimonthly' then 2
        when 'quarterly' then 3
        when 'semiannual' then 6
        when 'annual' then 12
        else 1
      end
    ) = 0;
$$;

create or replace function public.fixed_expense_amount_at(
  p_fixed_expense_id uuid,
  p_period date
)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (
      select change.amount
      from public.fixed_expense_amount_changes change
      where change.fixed_expense_id = p_fixed_expense_id
        and change.effective_period <= p_period
      order by change.effective_period desc
      limit 1
    ),
    (
      select expense.amount
      from public.fixed_expenses expense
      where expense.id = p_fixed_expense_id
    )
  );
$$;

create or replace function public.fixed_expense_card_family(p_source text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_source in ('naranja', 'naranjax') then 'naranja'
    when p_source = 'galicia' then 'galicia'
    when p_source = 'other' then 'other'
    else null
  end;
$$;

create or replace function public.fixed_expense_amount_within_tolerance(
  p_amount numeric,
  p_expected numeric
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_expected > 0
    and abs(p_amount - p_expected) <= (p_expected * 0.05);
$$;

create or replace function public.normalize_fixed_expense_text(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    btrim(
      regexp_replace(
        translate(
          lower(coalesce(p_value, '')),
          'áéíóúüñàèìòùâêîôûäëïöü',
          'aeiouunaeiouaeiouaeiou'
        ),
        '[^a-z0-9]+',
        ' ',
        'g'
      )
    ),
    ''
  );
$$;

create or replace function public.fixed_expense_bigram_dice(
  p_left text,
  p_right text
)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_left text := regexp_replace(coalesce(p_left, ''), ' ', '', 'g');
  v_right text := regexp_replace(coalesce(p_right, ''), ' ', '', 'g');
  v_left_count integer := greatest(char_length(v_left) - 1, 0);
  v_right_count integer := greatest(char_length(v_right) - 1, 0);
  v_shared integer;
begin
  if v_left_count = 0 or v_right_count = 0 then
    return 0;
  end if;

  select count(*)::integer
    into v_shared
  from (
    select
      substr(v_left, pos, 2) as gram,
      row_number() over (
        partition by substr(v_left, pos, 2)
        order by pos
      ) as nth
    from generate_series(1, v_left_count) as pos
  ) left_grams
  join (
    select
      substr(v_right, pos, 2) as gram,
      row_number() over (
        partition by substr(v_right, pos, 2)
        order by pos
      ) as nth
    from generate_series(1, v_right_count) as pos
  ) right_grams using (gram, nth);

  return (2.0 * v_shared) / (v_left_count + v_right_count);
end;
$$;

create or replace function public.fixed_expense_text_matches(
  p_name text,
  p_merchant text
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_name text := public.normalize_fixed_expense_text(p_name);
  v_merchant text := public.normalize_fixed_expense_text(p_merchant);
  v_token text;
begin
  if v_name is null or v_merchant is null then
    return false;
  end if;

  if char_length(v_name) >= 4 and position(v_name in v_merchant) > 0 then
    return true;
  end if;

  if char_length(v_merchant) >= 4 and position(v_merchant in v_name) > 0 then
    return true;
  end if;

  for v_token in
    select token
    from regexp_split_to_table(v_name, ' ') as token
    where char_length(token) >= 4
  loop
    if position(v_token in v_merchant) > 0 then
      return true;
    end if;
  end loop;

  return public.fixed_expense_bigram_dice(v_name, v_merchant) >= 0.5;
end;
$$;

create or replace function public.fixed_expense_period_payload(p_period_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_period public.fixed_expense_periods;
  v_category public.categories;
  v_paid numeric;
begin
  select *
    into v_period
  from public.fixed_expense_periods
  where id = p_period_id;

  if v_period.id is null then
    return null;
  end if;

  select *
    into v_category
  from public.categories
  where id = v_period.category_id;

  select coalesce(sum(payment.amount), 0)
    into v_paid
  from public.fixed_expense_payments payment
  where payment.fixed_expense_period_id = v_period.id;

  return jsonb_build_object(
    'id', v_period.id,
    'fixedExpenseId', v_period.fixed_expense_id,
    'householdId', v_period.household_id,
    'period', v_period.period,
    'name', v_period.name,
    'categoryId', v_period.category_id,
    'expectedAmount', v_period.expected_amount,
    'totalPaid', v_paid,
    'remaining', greatest(v_period.expected_amount - v_paid, 0),
    'chargeDate', v_period.charge_date,
    'dueDate', v_period.due_date,
    'status', case
      when v_paid >= v_period.expected_amount then 'paid'
      when current_date > v_period.due_date then 'overdue'
      when v_paid > 0 then 'partial'
      when current_date < v_period.charge_date then 'upcoming'
      else 'pending'
    end,
    'category', case
      when v_category.id is null then null
      else jsonb_build_object(
        'id', v_category.id,
        'name', v_category.name,
        'icon', v_category.icon
      )
    end,
    'lastPayment', (
      select jsonb_build_object(
        'id', latest.id,
        'amount', latest.amount,
        'paidAt', latest.paid_at
      )
      from public.fixed_expense_payments latest
      where latest.fixed_expense_period_id = v_period.id
      order by latest.paid_at desc, latest.created_at desc, latest.id desc
      limit 1
    )
  );
end;
$$;

create or replace function public.ensure_fixed_expense_periods(
  p_household_id uuid,
  p_period date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_period is null or p_period <> date_trunc('month', p_period)::date then
    raise exception 'Period must be the first day of a month';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Household membership required';
  end if;

  insert into public.fixed_expense_periods (
    fixed_expense_id,
    household_id,
    period,
    expected_amount,
    category_id,
    name,
    charge_date,
    due_date
  )
  select
    expense.id,
    expense.household_id,
    p_period,
    public.fixed_expense_amount_at(expense.id, p_period),
    expense.category_id,
    expense.name,
    public.resolve_fixed_expense_month_day(p_period, expense.charge_day),
    public.resolve_fixed_expense_month_day(p_period, expense.due_day)
  from public.fixed_expenses expense
  where expense.household_id = p_household_id
    and expense.is_active
    and public.fixed_expense_period_applies(expense.created_at, expense.frequency, p_period)
    and public.resolve_fixed_expense_month_day(p_period, expense.charge_day)
      <= public.resolve_fixed_expense_month_day(p_period, expense.due_day)
  on conflict (fixed_expense_id, period) do nothing;
end;
$$;

create or replace function public.get_fixed_expense_periods(
  p_household_id uuid,
  p_period date
)
returns setof jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ensure_fixed_expense_periods(p_household_id, p_period);

  return query
  select public.fixed_expense_period_payload(period.id)
  from public.fixed_expense_periods period
  where period.household_id = p_household_id
    and period.period = p_period
  order by period.due_date asc, period.name asc;
end;
$$;

create or replace function public.apply_fixed_expense_amount_change(
  p_fixed_expense_id uuid,
  p_period date,
  p_amount numeric,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expense public.fixed_expenses;
begin
  if p_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_period is null or p_period <> date_trunc('month', p_period)::date then
    raise exception 'Period must be the first day of a month';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid fixed expense amount';
  end if;

  select *
    into v_expense
  from public.fixed_expenses
  where id = p_fixed_expense_id
  for update;

  if v_expense.id is null then
    raise exception 'Fixed expense not found';
  end if;

  if p_period < date_trunc('month', v_expense.created_at)::date then
    raise exception 'El período es anterior al alta del gasto fijo.';
  end if;

  if p_period > (date_trunc('month', current_date)::date + interval '24 months')::date then
    raise exception 'Elige un período más cercano.';
  end if;

  insert into public.fixed_expense_amount_changes (
    fixed_expense_id,
    household_id,
    effective_period,
    amount,
    created_by
  )
  values (
    v_expense.id,
    v_expense.household_id,
    p_period,
    p_amount,
    p_actor_id
  )
  on conflict (fixed_expense_id, effective_period) do update
    set amount = excluded.amount,
        created_by = excluded.created_by,
        created_at = now();

  if exists (
    select 1
    from public.fixed_expense_periods period
    where period.fixed_expense_id = v_expense.id
      and period.period >= p_period
      and coalesce((
        select sum(payment.amount)
        from public.fixed_expense_payments payment
        where payment.fixed_expense_period_id = period.id
      ), 0) > public.fixed_expense_amount_at(period.fixed_expense_id, period.period)
  ) then
    raise exception 'El monto nuevo queda por debajo de lo ya pagado.';
  end if;

  update public.fixed_expense_periods period
     set expected_amount = public.fixed_expense_amount_at(period.fixed_expense_id, period.period),
         updated_at = now()
   where period.fixed_expense_id = v_expense.id
     and period.period >= p_period;

  update public.fixed_expenses
     set amount = public.fixed_expense_amount_at(
           id,
           date_trunc('month', current_date)::date
         ),
         updated_at = now()
   where id = v_expense.id;
end;
$$;

drop function if exists public.create_fixed_expense_with_activity(
  uuid,
  uuid,
  text,
  numeric,
  integer,
  integer
);

create or replace function public.create_fixed_expense_with_activity(
  p_household_id uuid,
  p_category_id uuid,
  p_name text,
  p_amount numeric,
  p_charge_day integer,
  p_due_day integer,
  p_frequency text default 'monthly',
  p_auto_debit boolean default false,
  p_auto_debit_source text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_fixed_expense public.fixed_expenses;
  v_category public.categories;
  v_actor_profile public.profiles;
  v_frequency text := coalesce(p_frequency, 'monthly');
  v_auto_debit boolean := coalesce(p_auto_debit, false);
  v_auto_debit_source text := nullif(btrim(coalesce(p_auto_debit_source, '')), '');
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Household membership required';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then
    raise exception 'Invalid fixed expense name';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid fixed expense amount';
  end if;

  if p_charge_day is null or p_charge_day not between 1 and 31
     or p_due_day is null or p_due_day not between 1 and 31 then
    raise exception 'Invalid fixed expense day';
  end if;

  if v_frequency not in ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual') then
    raise exception 'La frecuencia no es válida.';
  end if;

  if v_auto_debit then
    if v_auto_debit_source is null
       or v_auto_debit_source not in ('naranja', 'galicia', 'other') then
      raise exception 'Elige la tarjeta del débito automático.';
    end if;
  else
    v_auto_debit_source := null;
  end if;

  select *
    into v_category
  from public.categories category
  where category.id = p_category_id
    and category.household_id = p_household_id
    and category.type = 'expense';

  if v_category.id is null then
    raise exception 'Fixed expense category does not belong to household or is not an expense category';
  end if;

  insert into public.fixed_expenses (
    household_id,
    created_by,
    category_id,
    name,
    amount,
    charge_day,
    due_day,
    frequency,
    auto_debit,
    auto_debit_source
  )
  values (
    p_household_id,
    v_actor_id,
    p_category_id,
    btrim(p_name),
    p_amount,
    p_charge_day,
    p_due_day,
    v_frequency,
    v_auto_debit,
    v_auto_debit_source
  )
  returning * into v_fixed_expense;

  insert into public.fixed_expense_amount_changes (
    fixed_expense_id,
    household_id,
    effective_period,
    amount,
    created_by
  )
  values (
    v_fixed_expense.id,
    v_fixed_expense.household_id,
    date_trunc('month', v_fixed_expense.created_at)::date,
    v_fixed_expense.amount,
    v_actor_id
  );

  select *
    into v_actor_profile
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
    v_fixed_expense.household_id,
    v_actor_id,
    'fixed_expense_created',
    'fixed_expense',
    v_fixed_expense.id,
    jsonb_build_object(
      'name', v_fixed_expense.name,
      'amount', v_fixed_expense.amount
    )
  );

  return to_jsonb(v_fixed_expense) || jsonb_build_object(
    'category', jsonb_build_object(
      'id', v_category.id,
      'name', v_category.name,
      'icon', v_category.icon
    ),
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

drop function if exists public.update_fixed_expense_with_activity(
  uuid,
  date,
  text,
  numeric,
  uuid,
  integer,
  integer,
  boolean
);

create or replace function public.update_fixed_expense_with_activity(
  p_fixed_expense_id uuid,
  p_period date,
  p_name text,
  p_amount numeric,
  p_category_id uuid,
  p_charge_day integer,
  p_due_day integer,
  p_is_active boolean,
  p_frequency text default null,
  p_auto_debit boolean default null,
  p_auto_debit_source text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_fixed_expense public.fixed_expenses;
  v_category public.categories;
  v_actor_profile public.profiles;
  v_frequency text;
  v_auto_debit boolean;
  v_auto_debit_source text;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_period is null or p_period <> date_trunc('month', p_period)::date then
    raise exception 'Period must be the first day of a month';
  end if;

  select *
    into v_fixed_expense
  from public.fixed_expenses expense
  where expense.id = p_fixed_expense_id
  for update;

  if v_fixed_expense.id is null then
    raise exception 'Fixed expense not found';
  end if;

  if not public.is_household_member(v_fixed_expense.household_id) then
    raise exception 'Household membership required';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then
    raise exception 'Invalid fixed expense name';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid fixed expense amount';
  end if;

  if p_charge_day is null or p_charge_day not between 1 and 31
     or p_due_day is null or p_due_day not between 1 and 31 then
    raise exception 'Invalid fixed expense day';
  end if;

  v_frequency := coalesce(p_frequency, v_fixed_expense.frequency);
  if v_frequency not in ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual') then
    raise exception 'La frecuencia no es válida.';
  end if;

  v_auto_debit := coalesce(p_auto_debit, v_fixed_expense.auto_debit);
  if p_auto_debit is null and p_auto_debit_source is null then
    v_auto_debit_source := v_fixed_expense.auto_debit_source;
  else
    v_auto_debit_source := nullif(btrim(coalesce(p_auto_debit_source, '')), '');
  end if;

  if v_auto_debit then
    if v_auto_debit_source is null
       or v_auto_debit_source not in ('naranja', 'galicia', 'other') then
      raise exception 'Elige la tarjeta del débito automático.';
    end if;
  else
    v_auto_debit_source := null;
  end if;

  select *
    into v_category
  from public.categories category
  where category.id = p_category_id
    and category.household_id = v_fixed_expense.household_id
    and category.type = 'expense';

  if v_category.id is null then
    raise exception 'Fixed expense category does not belong to household or is not an expense category';
  end if;

  if p_amount is distinct from public.fixed_expense_amount_at(v_fixed_expense.id, p_period) then
    perform public.apply_fixed_expense_amount_change(
      v_fixed_expense.id,
      p_period,
      p_amount,
      v_actor_id
    );
  end if;

  update public.fixed_expenses
     set category_id = p_category_id,
         name = btrim(p_name),
         amount = public.fixed_expense_amount_at(
           id,
           date_trunc('month', current_date)::date
         ),
         charge_day = p_charge_day,
         due_day = p_due_day,
         is_active = coalesce(p_is_active, true),
         frequency = v_frequency,
         auto_debit = v_auto_debit,
         auto_debit_source = v_auto_debit_source,
         updated_at = now()
   where id = p_fixed_expense_id
  returning * into v_fixed_expense;

  update public.fixed_expense_periods
     set name = v_fixed_expense.name,
         category_id = v_fixed_expense.category_id,
         expected_amount = public.fixed_expense_amount_at(v_fixed_expense.id, p_period),
         charge_date = public.resolve_fixed_expense_month_day(p_period, v_fixed_expense.charge_day),
         due_date = public.resolve_fixed_expense_month_day(p_period, v_fixed_expense.due_day),
         updated_at = now()
   where fixed_expense_id = v_fixed_expense.id
     and household_id = v_fixed_expense.household_id
     and period = p_period;

  select *
    into v_actor_profile
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
    v_fixed_expense.household_id,
    v_actor_id,
    'fixed_expense_updated',
    'fixed_expense',
    v_fixed_expense.id,
    jsonb_build_object(
      'name', v_fixed_expense.name,
      'amount', p_amount,
      'effectivePeriod', p_period
    )
  );

  return to_jsonb(v_fixed_expense) || jsonb_build_object(
    'category', jsonb_build_object(
      'id', v_category.id,
      'name', v_category.name,
      'icon', v_category.icon
    ),
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

create or replace function public.record_fixed_expense_amount(
  p_fixed_expense_id uuid,
  p_period date,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_expense public.fixed_expenses;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into v_expense
  from public.fixed_expenses
  where id = p_fixed_expense_id;

  if v_expense.id is null then
    raise exception 'Fixed expense not found';
  end if;

  if not public.is_household_member(v_expense.household_id) then
    raise exception 'Household membership required';
  end if;

  perform public.apply_fixed_expense_amount_change(
    v_expense.id,
    p_period,
    p_amount,
    v_actor_id
  );

  select *
    into v_expense
  from public.fixed_expenses
  where id = p_fixed_expense_id;

  insert into public.household_activity (
    household_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_expense.household_id,
    v_actor_id,
    'fixed_expense_updated',
    'fixed_expense',
    v_expense.id,
    jsonb_build_object(
      'name', v_expense.name,
      'amount', p_amount,
      'effectivePeriod', p_period
    )
  );

  return jsonb_build_object(
    'fixedExpenseId', v_expense.id,
    'amount', v_expense.amount,
    'effectivePeriod', p_period
  );
end;
$$;

create or replace function public.get_fixed_expense_history(
  p_fixed_expense_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_expense public.fixed_expenses;
  v_category public.categories;
  v_current date := date_trunc('month', current_date)::date;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into v_expense
  from public.fixed_expenses
  where id = p_fixed_expense_id;

  if v_expense.id is null then
    raise exception 'Fixed expense not found';
  end if;

  if not public.is_household_member(v_expense.household_id) then
    raise exception 'Household membership required';
  end if;

  if public.fixed_expense_period_applies(v_expense.created_at, v_expense.frequency, v_current)
     and public.resolve_fixed_expense_month_day(v_current, v_expense.charge_day)
       <= public.resolve_fixed_expense_month_day(v_current, v_expense.due_day) then
    insert into public.fixed_expense_periods (
      fixed_expense_id,
      household_id,
      period,
      expected_amount,
      category_id,
      name,
      charge_date,
      due_date
    )
    values (
      v_expense.id,
      v_expense.household_id,
      v_current,
      public.fixed_expense_amount_at(v_expense.id, v_current),
      v_expense.category_id,
      v_expense.name,
      public.resolve_fixed_expense_month_day(v_current, v_expense.charge_day),
      public.resolve_fixed_expense_month_day(v_current, v_expense.due_day)
    )
    on conflict (fixed_expense_id, period) do nothing;
  end if;

  select *
    into v_category
  from public.categories
  where id = v_expense.category_id;

  return jsonb_build_object(
    'expense', to_jsonb(v_expense) || jsonb_build_object(
      'category', case
        when v_category.id is null then null
        else jsonb_build_object(
          'id', v_category.id,
          'name', v_category.name,
          'icon', v_category.icon
        )
      end
    ),
    'amountChanges', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', change.id,
          'effectivePeriod', change.effective_period,
          'amount', change.amount,
          'createdAt', change.created_at
        )
        order by change.effective_period desc
      )
      from public.fixed_expense_amount_changes change
      where change.fixed_expense_id = v_expense.id
    ), '[]'::jsonb),
    'periods', coalesce((
      select jsonb_agg(
        public.fixed_expense_period_payload(period.id)
        order by period.period desc
      )
      from (
        select history.id, history.period
        from public.fixed_expense_periods history
        where history.fixed_expense_id = v_expense.id
        order by history.period desc
        limit 24
      ) period
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.pending_charge_matches_period(
  p_charge public.pending_bank_charges,
  p_period_id uuid
)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  v_period public.fixed_expense_periods;
  v_expense public.fixed_expenses;
  v_paid numeric;
  v_charged_on date := coalesce(p_charge.charged_at, current_date);
begin
  select *
    into v_period
  from public.fixed_expense_periods
  where id = p_period_id;

  if v_period.id is null then
    return false;
  end if;

  select *
    into v_expense
  from public.fixed_expenses
  where id = v_period.fixed_expense_id;

  if v_expense.id is null or not v_expense.is_active or not v_expense.auto_debit then
    return false;
  end if;

  if v_expense.auto_debit_source is distinct from public.fixed_expense_card_family(p_charge.source) then
    return false;
  end if;

  if not exists (
    select 1
    from public.household_members member
    where member.household_id = v_expense.household_id
      and member.user_id = p_charge.user_id
  ) then
    return false;
  end if;

  if v_period.period is distinct from date_trunc('month', v_charged_on)::date then
    return false;
  end if;

  if v_charged_on < v_period.charge_date or v_charged_on > v_period.due_date then
    return false;
  end if;

  if not public.fixed_expense_text_matches(v_expense.name, p_charge.merchant) then
    return false;
  end if;

  if not public.fixed_expense_amount_within_tolerance(p_charge.amount, v_period.expected_amount) then
    return false;
  end if;

  select coalesce(sum(payment.amount), 0)
    into v_paid
  from public.fixed_expense_payments payment
  where payment.fixed_expense_period_id = v_period.id;

  return p_charge.amount <= greatest(v_period.expected_amount - v_paid, 0);
end;
$$;

create or replace function public.match_auto_debit_charge(
  p_user_id uuid,
  p_source text,
  p_merchant text,
  p_amount numeric,
  p_charged_on date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_charged_on date := coalesce(p_charged_on, current_date);
  v_period date := date_trunc('month', v_charged_on)::date;
  v_card text := public.fixed_expense_card_family(p_source);
  v_match uuid;
begin
  if p_user_id is null or v_card is null or p_amount is null or p_amount <= 0 then
    return null;
  end if;

  insert into public.fixed_expense_periods (
    fixed_expense_id,
    household_id,
    period,
    expected_amount,
    category_id,
    name,
    charge_date,
    due_date
  )
  select
    expense.id,
    expense.household_id,
    v_period,
    public.fixed_expense_amount_at(expense.id, v_period),
    expense.category_id,
    expense.name,
    public.resolve_fixed_expense_month_day(v_period, expense.charge_day),
    public.resolve_fixed_expense_month_day(v_period, expense.due_day)
  from public.fixed_expenses expense
  join public.household_members member
    on member.household_id = expense.household_id
   and member.user_id = p_user_id
  where expense.is_active
    and expense.auto_debit
    and expense.auto_debit_source = v_card
    and public.fixed_expense_period_applies(expense.created_at, expense.frequency, v_period)
    and public.fixed_expense_text_matches(expense.name, p_merchant)
    and public.resolve_fixed_expense_month_day(v_period, expense.charge_day)
      <= public.resolve_fixed_expense_month_day(v_period, expense.due_day)
  on conflict (fixed_expense_id, period) do nothing;

  select period.id
    into v_match
  from public.fixed_expense_periods period
  join public.fixed_expenses expense
    on expense.id = period.fixed_expense_id
  join public.household_members member
    on member.household_id = expense.household_id
   and member.user_id = p_user_id
  where expense.is_active
    and expense.auto_debit
    and expense.auto_debit_source = v_card
    and period.period = v_period
    and v_charged_on between period.charge_date and period.due_date
    and public.fixed_expense_text_matches(expense.name, p_merchant)
    and public.fixed_expense_amount_within_tolerance(p_amount, period.expected_amount)
    and p_amount <= greatest(
      period.expected_amount - coalesce((
        select sum(payment.amount)
        from public.fixed_expense_payments payment
        where payment.fixed_expense_period_id = period.id
      ), 0),
      0
    )
  order by abs(p_amount - period.expected_amount), period.due_date, period.id
  limit 1;

  return v_match;
end;
$$;

create or replace function public.get_pending_charge_suggestion(
  p_charge_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_charge public.pending_bank_charges;
  v_period public.fixed_expense_periods;
  v_paid numeric;
begin
  if v_actor_id is null then
    raise exception 'Tienes que iniciar sesión.';
  end if;

  select *
    into v_charge
  from public.pending_bank_charges
  where id = p_charge_id
    and user_id = v_actor_id;

  if v_charge.id is null
     or v_charge.status <> 'pending'
     or v_charge.suggested_period_id is null then
    return null;
  end if;

  if not public.pending_charge_matches_period(v_charge, v_charge.suggested_period_id) then
    return null;
  end if;

  select *
    into v_period
  from public.fixed_expense_periods
  where id = v_charge.suggested_period_id;

  select coalesce(sum(payment.amount), 0)
    into v_paid
  from public.fixed_expense_payments payment
  where payment.fixed_expense_period_id = v_period.id;

  return jsonb_build_object(
    'periodId', v_period.id,
    'fixedExpenseId', v_period.fixed_expense_id,
    'householdId', v_period.household_id,
    'name', v_period.name,
    'period', v_period.period,
    'expectedAmount', v_period.expected_amount,
    'remaining', greatest(v_period.expected_amount - v_paid, 0)
  );
end;
$$;

create or replace function public.link_pending_charge_to_period(
  p_charge_id uuid,
  p_period_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_charge public.pending_bank_charges;
  v_period public.fixed_expense_periods;
  v_household public.households;
  v_payment jsonb;
  v_transaction_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Tienes que iniciar sesión.';
  end if;

  select *
    into v_charge
  from public.pending_bank_charges
  where id = p_charge_id
    and user_id = v_actor_id
  for update;

  if v_charge.id is null then
    raise exception 'No encontramos ese gasto.';
  end if;

  if v_charge.status <> 'pending' then
    raise exception 'Ese gasto ya no está pendiente.';
  end if;

  select *
    into v_period
  from public.fixed_expense_periods
  where id = p_period_id
  for update;

  if v_period.id is null then
    raise exception 'No encontramos ese período.';
  end if;

  if not public.is_household_member(v_period.household_id) then
    raise exception 'No perteneces a ese espacio.';
  end if;

  if not public.pending_charge_matches_period(v_charge, v_period.id) then
    raise exception 'Ese débito ya no coincide con el gasto fijo.';
  end if;

  select *
    into v_household
  from public.households
  where id = v_period.household_id;

  if upper(trim(coalesce(nullif(v_charge.currency, ''), 'ARS')))
     is distinct from upper(trim(coalesce(nullif(v_household.currency, ''), 'ARS'))) then
    raise exception 'La moneda del gasto no coincide con la del espacio.';
  end if;

  v_payment := public.pay_fixed_expense_period(
    v_period.id,
    v_charge.amount,
    coalesce(v_charge.charged_at, current_date)
  );
  v_transaction_id := nullif(v_payment->>'transactionId', '')::uuid;

  if v_transaction_id is null then
    raise exception 'No se pudo registrar el pago.';
  end if;

  update public.pending_bank_charges
     set status = 'assigned',
         transaction_id = v_transaction_id,
         suggested_period_id = v_period.id,
         resolved_at = now()
   where id = v_charge.id
     and user_id = v_actor_id
     and status = 'pending';

  if not found then
    raise exception 'Ese gasto ya no está pendiente.';
  end if;

  return v_payment || jsonb_build_object(
    'householdId', v_period.household_id,
    'periodId', v_period.id
  );
end;
$$;

revoke all on function public.fixed_expense_period_applies(timestamptz, text, date) from public, anon, authenticated;
revoke all on function public.fixed_expense_amount_at(uuid, date) from public, anon, authenticated;
revoke all on function public.fixed_expense_card_family(text) from public, anon, authenticated;
revoke all on function public.fixed_expense_amount_within_tolerance(numeric, numeric) from public, anon, authenticated;
revoke all on function public.normalize_fixed_expense_text(text) from public, anon, authenticated;
revoke all on function public.fixed_expense_bigram_dice(text, text) from public, anon, authenticated;
revoke all on function public.fixed_expense_text_matches(text, text) from public, anon, authenticated;
revoke all on function public.fixed_expense_period_payload(uuid) from public, anon, authenticated;
revoke all on function public.apply_fixed_expense_amount_change(uuid, date, numeric, uuid) from public, anon, authenticated;
revoke all on function public.pending_charge_matches_period(public.pending_bank_charges, uuid) from public, anon, authenticated;
revoke all on function public.match_auto_debit_charge(uuid, text, text, numeric, date) from public, anon, authenticated;

grant execute on function public.match_auto_debit_charge(uuid, text, text, numeric, date) to service_role;

revoke all on function public.create_fixed_expense_with_activity(uuid, uuid, text, numeric, integer, integer, text, boolean, text) from public, anon;
grant execute on function public.create_fixed_expense_with_activity(uuid, uuid, text, numeric, integer, integer, text, boolean, text) to authenticated;

revoke all on function public.update_fixed_expense_with_activity(uuid, date, text, numeric, uuid, integer, integer, boolean, text, boolean, text) from public, anon;
grant execute on function public.update_fixed_expense_with_activity(uuid, date, text, numeric, uuid, integer, integer, boolean, text, boolean, text) to authenticated;

revoke all on function public.record_fixed_expense_amount(uuid, date, numeric) from public, anon;
grant execute on function public.record_fixed_expense_amount(uuid, date, numeric) to authenticated;

revoke all on function public.get_fixed_expense_history(uuid) from public, anon;
grant execute on function public.get_fixed_expense_history(uuid) to authenticated;

revoke all on function public.get_pending_charge_suggestion(uuid) from public, anon;
grant execute on function public.get_pending_charge_suggestion(uuid) to authenticated;

revoke all on function public.link_pending_charge_to_period(uuid, uuid) from public, anon;
grant execute on function public.link_pending_charge_to_period(uuid, uuid) to authenticated;
