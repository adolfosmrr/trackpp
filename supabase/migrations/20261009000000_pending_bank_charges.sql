-- Additive migration. Do not recreate transactions, households, categories,
-- profiles, or household_activity. Apply this file once on the existing database.
--
-- Writes to pending_bank_charges happen only from the service role (ingest)
-- and from the security definer RPCs below. Those RPCs live in public so the
-- app can call them through PostgREST, same as create_transaction_with_activity.
-- search_path is empty, anon/public cannot execute them, and they re-check
-- auth.uid() plus household membership.

create table public.pending_bank_charges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source text not null,
  external_ref text not null,
  amount numeric not null,
  currency text not null default 'ARS',
  merchant text null,
  card_last4 text null,
  charged_at date null,
  raw jsonb null,
  status text not null default 'pending',
  transaction_id uuid null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null,
  constraint pending_bank_charges_user_id_fkey
    foreign key (user_id)
    references public.profiles (id)
    on delete cascade,
  constraint pending_bank_charges_transaction_id_fkey
    foreign key (transaction_id)
    references public.transactions (id)
    on delete set null,
  constraint pending_bank_charges_external_ref_key
    unique (external_ref),
  constraint pending_bank_charges_source_check
    check (source in ('naranja', 'naranjax', 'galicia', 'other')),
  constraint pending_bank_charges_status_check
    check (status in ('pending', 'assigned', 'dismissed')),
  constraint pending_bank_charges_amount_check
    check (amount > 0),
  constraint pending_bank_charges_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint pending_bank_charges_card_last4_check
    check (card_last4 is null or card_last4 ~ '^[0-9]{4}$')
);

create index pending_bank_charges_user_status_created_idx
  on public.pending_bank_charges (user_id, status, created_at desc);

alter table public.pending_bank_charges enable row level security;

create policy "Users can read their pending bank charges"
  on public.pending_bank_charges
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.pending_bank_charges from public, anon, authenticated;
grant select on table public.pending_bank_charges to authenticated;
grant all on table public.pending_bank_charges to service_role;

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  expo_push_token text not null,
  platform text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_user_id_fkey
    foreign key (user_id)
    references public.profiles (id)
    on delete cascade,
  constraint push_tokens_expo_push_token_key
    unique (expo_push_token),
  constraint push_tokens_platform_check
    check (platform in ('ios', 'android'))
);

create index push_tokens_user_id_idx
  on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "Users can read their push tokens"
  on public.push_tokens
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can delete their push tokens"
  on public.push_tokens
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.push_tokens from public, anon, authenticated;
grant select, delete on table public.push_tokens to authenticated;
grant all on table public.push_tokens to service_role;

create or replace function public.register_push_token(
  p_expo_push_token text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text := trim(coalesce(p_expo_push_token, ''));
  v_platform text := lower(trim(coalesce(p_platform, '')));
begin
  if v_user_id is null then
    raise exception 'Tenés que iniciar sesión.';
  end if;

  if v_platform not in ('ios', 'android') then
    raise exception 'La plataforma del aviso no es válida.';
  end if;

  if v_token !~ '^Expo(nent)?PushToken\[[^]]+\]$'
     or v_token ~ '[[:space:]]' then
    raise exception 'El token de avisos no es válido.';
  end if;

  delete from public.push_tokens
  where expo_push_token = v_token
    and user_id <> v_user_id;

  insert into public.push_tokens (
    user_id,
    expo_push_token,
    platform,
    updated_at
  )
  values (
    v_user_id,
    v_token,
    v_platform,
    now()
  )
  on conflict (expo_push_token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
end;
$$;

revoke all on function public.register_push_token(text, text) from public, anon, authenticated;
grant execute on function public.register_push_token(text, text) to authenticated;

create or replace function public.assign_pending_charge(
  p_charge_id uuid,
  p_household_id uuid,
  p_category_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_charge public.pending_bank_charges;
  v_household public.households;
  v_charge_currency text;
  v_household_currency text;
  v_title text;
  v_description text;
  v_source_label text;
  v_result jsonb;
  v_transaction_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Tenés que iniciar sesión.';
  end if;

  if p_category_id is null then
    raise exception 'Elegí una categoría.';
  end if;

  select *
  into v_charge
  from public.pending_bank_charges
  where id = p_charge_id
    and user_id = v_actor_id
  for update;

  if not found then
    raise exception 'No encontramos ese gasto.';
  end if;

  if v_charge.status <> 'pending' then
    raise exception 'Ese gasto ya no está pendiente.';
  end if;

  select *
  into v_household
  from public.households
  where id = p_household_id;

  if not found then
    raise exception 'Ese espacio no existe.';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'No pertenecés a ese espacio.';
  end if;

  v_charge_currency := upper(trim(coalesce(nullif(v_charge.currency, ''), 'ARS')));
  v_household_currency := upper(trim(coalesce(nullif(v_household.currency, ''), 'ARS')));

  if v_charge_currency <> v_household_currency then
    raise exception
      'La moneda del gasto (%) no coincide con la del espacio (%).',
      v_charge_currency,
      v_household_currency;
  end if;

  if not exists (
    select 1
    from public.categories c
    where c.id = p_category_id
      and c.household_id = p_household_id
      and c.type = 'expense'
  ) then
    raise exception 'La categoría no pertenece a ese espacio.';
  end if;

  v_title := regexp_replace(trim(coalesce(v_charge.merchant, '')), '[[:space:]]+', ' ', 'g');
  if v_title = '' then
    v_title := 'Gasto con tarjeta';
  end if;
  if char_length(v_title) > 140 then
    v_title := left(v_title, 140);
  end if;

  v_source_label := case v_charge.source
    when 'naranja' then 'Naranja'
    when 'naranjax' then 'Naranja X'
    when 'galicia' then 'Banco Galicia'
    else 'Tarjeta'
  end;

  v_description := v_source_label;
  if nullif(trim(coalesce(v_charge.card_last4, '')), '') is not null then
    v_description := v_description || ' · ****' || trim(v_charge.card_last4);
  end if;

  v_result := public.create_transaction_with_activity(
    p_household_id,
    'expense',
    v_title,
    v_charge.amount,
    v_description,
    p_category_id,
    coalesce(v_charge.charged_at, current_date)
  );

  v_transaction_id := nullif(v_result->>'id', '')::uuid;
  if v_transaction_id is null then
    raise exception 'No se pudo crear el movimiento.';
  end if;

  update public.pending_bank_charges
  set status = 'assigned',
      transaction_id = v_transaction_id,
      resolved_at = now()
  where id = v_charge.id
    and user_id = v_actor_id
    and status = 'pending';

  if not found then
    raise exception 'Ese gasto ya no está pendiente.';
  end if;

  return v_result;
end;
$$;

revoke all on function public.assign_pending_charge(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.assign_pending_charge(uuid, uuid, uuid) to authenticated;

create or replace function public.dismiss_pending_charge(
  p_charge_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_charge public.pending_bank_charges;
begin
  if v_actor_id is null then
    raise exception 'Tenés que iniciar sesión.';
  end if;

  select *
  into v_charge
  from public.pending_bank_charges
  where id = p_charge_id
    and user_id = v_actor_id
  for update;

  if not found then
    raise exception 'No encontramos ese gasto.';
  end if;

  if v_charge.status <> 'pending' then
    raise exception 'Ese gasto ya no está pendiente.';
  end if;

  update public.pending_bank_charges
  set status = 'dismissed',
      resolved_at = now()
  where id = v_charge.id
    and user_id = v_actor_id
    and status = 'pending';

  if not found then
    raise exception 'Ese gasto ya no está pendiente.';
  end if;
end;
$$;

revoke all on function public.dismiss_pending_charge(uuid) from public, anon, authenticated;
grant execute on function public.dismiss_pending_charge(uuid) to authenticated;
