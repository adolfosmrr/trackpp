-- Additive. Households already have currency (default ARS) and type
-- (personal | couple, default personal). There was no create RPC: the app
-- posted to the HTTP API, which this client treated as a shared space.
--
-- Not applied to the remote project. Apply this file once before the app
-- build that calls create_household.

create or replace function public.create_household(
  p_name text,
  p_type text,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_household public.households;
  v_name text := trim(p_name);
  v_type text := lower(trim(coalesce(p_type, '')));
  v_currency text := upper(trim(coalesce(p_currency, '')));
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 100 then
    raise exception 'Household name must be between 1 and 100 characters';
  end if;

  if v_type not in ('personal', 'couple') then
    raise exception 'Household type must be personal or couple';
  end if;

  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'Currency must be a 3-letter code';
  end if;

  insert into public.households (
    name,
    type,
    currency,
    created_by
  )
  values (
    v_name,
    v_type,
    v_currency,
    v_user_id
  )
  returning *
  into v_household;

  insert into public.household_members (
    household_id,
    user_id,
    role
  )
  values (
    v_household.id,
    v_user_id,
    'owner'
  );

  perform public.create_default_categories(v_household.id);

  return jsonb_build_object(
    'id', v_household.id,
    'name', v_household.name,
    'type', v_household.type,
    'currency', v_household.currency,
    'created_by', v_household.created_by,
    'created_at', v_household.created_at
  );
end;
$$;

revoke all on function public.create_household(text, text, text) from public, anon;
grant execute on function public.create_household(text, text, text) to authenticated;
