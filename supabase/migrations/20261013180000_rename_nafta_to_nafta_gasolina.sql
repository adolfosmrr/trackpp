-- Additive. 20261013170000_more_default_categories.sql is already applied.
-- Rename the seeded expense category Nafta to Nafta/Gasolina.
-- A household that already has Nafta/Gasolina for the same type keeps
-- its Nafta row, so the unique (household_id, name, type) key holds.
-- Custom rows named Nafta are left alone.
--
-- Not applied. Apply this file once after review.

update public.categories as category
set name = 'Nafta/Gasolina'
where category.is_default = true
  and category.name = 'Nafta'
  and not exists (
    select 1
    from public.categories as existing
    where existing.household_id = category.household_id
      and existing.type = category.type
      and existing.name = 'Nafta/Gasolina'
  );

create or replace function public.create_default_categories(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_household_member(target_household_id) then
    raise exception 'Not authorized for this household';
  end if;

  insert into public.categories (
    household_id,
    name,
    icon,
    type,
    is_default
  )
  values
    (target_household_id, 'Comida', '🍔', 'expense', true),
    (target_household_id, 'Transporte', '🚗', 'expense', true),
    (target_household_id, 'Hogar', '🏠', 'expense', true),
    (target_household_id, 'Entretenimiento', '🎮', 'expense', true),
    (target_household_id, 'Salud', '💊', 'expense', true),
    (target_household_id, 'Educación', '📚', 'expense', true),
    (target_household_id, 'Servicios', '💡', 'expense', true),
    (target_household_id, 'Otros gastos', '📦', 'expense', true),
    (target_household_id, 'Supermercado', '🛒', 'expense', true),
    (target_household_id, 'Verdulería', '🥬', 'expense', true),
    (target_household_id, 'Delivery', '🛵', 'expense', true),
    (target_household_id, 'Nafta/Gasolina', '⛽', 'expense', true),
    (target_household_id, 'Peajes', '🛣️', 'expense', true),
    (target_household_id, 'Estacionamiento', '🅿️', 'expense', true),
    (target_household_id, 'Expensas', '🏢', 'expense', true),
    (target_household_id, 'Alquiler', '🔑', 'expense', true),
    (target_household_id, 'Internet', '🌐', 'expense', true),
    (target_household_id, 'Celular', '📱', 'expense', true),
    (target_household_id, 'Streaming', '📺', 'expense', true),
    (target_household_id, 'Gimnasio', '🏋️', 'expense', true),
    (target_household_id, 'Farmacia', '💊', 'expense', true),
    (target_household_id, 'Prepaga', '🏥', 'expense', true),
    (target_household_id, 'Mascotas', '🐾', 'expense', true),
    (target_household_id, 'Regalos', '🎁', 'expense', true),
    (target_household_id, 'Ropa', '👕', 'expense', true),
    (target_household_id, 'Viajes', '✈️', 'expense', true),
    (target_household_id, 'Salidas', '🎉', 'expense', true),
    (target_household_id, 'Café', '☕', 'expense', true),
    (target_household_id, 'Cuidado personal', '🧴', 'expense', true),

    (target_household_id, 'Sueldo', '💼', 'income', true),
    (target_household_id, 'Freelance', '💻', 'income', true),
    (target_household_id, 'Regalo', '🎁', 'income', true),
    (target_household_id, 'Otros ingresos', '💰', 'income', true)

  on conflict (
    household_id,
    name,
    type
  )
  do nothing;
end;
$$;
