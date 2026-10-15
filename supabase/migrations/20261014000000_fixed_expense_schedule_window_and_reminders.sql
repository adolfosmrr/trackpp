-- Not applied. Adds the schedule window and reminder offsets for fixed expenses
-- without changing create_fixed_expense_with_activity or
-- update_fixed_expense_with_activity (those signatures stay valid before this
-- migration runs). The client calls save_fixed_expense_plan after the expense
-- is saved and surfaces the error if the function is missing.

alter table public.fixed_expenses
  add column if not exists starts_on date,
  add column if not exists ends_on date,
  add column if not exists charge_reminder_days integer[],
  add column if not exists start_reminder_days integer[] not null default '{}';

alter table public.fixed_expenses
  drop constraint if exists fixed_expenses_schedule_window_check;

alter table public.fixed_expenses
  add constraint fixed_expenses_schedule_window_check
  check (ends_on is null or starts_on is null or ends_on >= starts_on);

alter table public.fixed_expenses
  drop constraint if exists fixed_expenses_charge_reminder_days_check;

alter table public.fixed_expenses
  add constraint fixed_expenses_charge_reminder_days_check
  check (
    charge_reminder_days is null
    or charge_reminder_days <@ array[0, 1, 3, 5, 7]::integer[]
  );

alter table public.fixed_expenses
  drop constraint if exists fixed_expenses_start_reminder_days_check;

alter table public.fixed_expenses
  add constraint fixed_expenses_start_reminder_days_check
  check (start_reminder_days <@ array[1, 3, 7]::integer[]);

create or replace function public.save_fixed_expense_plan(
  p_fixed_expense_id uuid,
  p_starts_on date,
  p_ends_on date,
  p_charge_reminder_days integer[],
  p_start_reminder_days integer[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_household_id uuid;
  v_start integer[];
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select expense.household_id
    into v_household_id
  from public.fixed_expenses expense
  where expense.id = p_fixed_expense_id;

  if v_household_id is null then
    raise exception 'Fixed expense not found';
  end if;

  if not public.is_household_member(v_household_id) then
    raise exception 'Household membership required';
  end if;

  if p_ends_on is not null and p_starts_on is not null and p_ends_on < p_starts_on then
    raise exception 'End date is before the start date';
  end if;

  if p_charge_reminder_days is not null
     and not (p_charge_reminder_days <@ array[0, 1, 3, 5, 7]::integer[]) then
    raise exception 'Invalid charge reminder';
  end if;

  v_start := coalesce(p_start_reminder_days, '{}'::integer[]);
  if not (v_start <@ array[1, 3, 7]::integer[]) then
    raise exception 'Invalid start reminder';
  end if;

  update public.fixed_expenses
  set
    starts_on = p_starts_on,
    ends_on = p_ends_on,
    charge_reminder_days = case
      when p_charge_reminder_days is null then null
      else coalesce(
        (
          select array_agg(distinct day order by day)
          from unnest(p_charge_reminder_days) as day
        ),
        '{}'::integer[]
      )
    end,
    start_reminder_days = coalesce(
      (
        select array_agg(distinct day order by day)
        from unnest(v_start) as day
      ),
      '{}'::integer[]
    ),
    updated_at = now()
  where id = p_fixed_expense_id;
end;
$$;

revoke all on function public.save_fixed_expense_plan(uuid, date, date, integer[], integer[]) from public, anon;
grant execute on function public.save_fixed_expense_plan(uuid, date, date, integer[], integer[]) to authenticated;
