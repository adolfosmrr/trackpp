-- Additive. Default categories live in public.create_default_categories,
-- not in the app. Existing households only have the original 12 rows.
-- This replaces that function so new spaces get the extra expense
-- categories, and backfills spaces that already exist.
-- Educación already exists, so it is not inserted again.
-- Regalos is an expense; Regalo stays the income category.
--
-- Not applied to the remote project. Apply this file once.

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
    (target_household_id, 'Nafta', '⛽', 'expense', true),
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

insert into public.categories (
  household_id,
  name,
  icon,
  type,
  is_default
)
select
  household.id,
  seed.name,
  seed.icon,
  seed.type,
  true
from public.households household
cross join (
  values
    ('Supermercado', '🛒', 'expense'),
    ('Verdulería', '🥬', 'expense'),
    ('Delivery', '🛵', 'expense'),
    ('Nafta', '⛽', 'expense'),
    ('Peajes', '🛣️', 'expense'),
    ('Estacionamiento', '🅿️', 'expense'),
    ('Expensas', '🏢', 'expense'),
    ('Alquiler', '🔑', 'expense'),
    ('Internet', '🌐', 'expense'),
    ('Celular', '📱', 'expense'),
    ('Streaming', '📺', 'expense'),
    ('Gimnasio', '🏋️', 'expense'),
    ('Farmacia', '💊', 'expense'),
    ('Prepaga', '🏥', 'expense'),
    ('Mascotas', '🐾', 'expense'),
    ('Regalos', '🎁', 'expense'),
    ('Ropa', '👕', 'expense'),
    ('Viajes', '✈️', 'expense'),
    ('Salidas', '🎉', 'expense'),
    ('Café', '☕', 'expense'),
    ('Cuidado personal', '🧴', 'expense')
) as seed(name, icon, type)
on conflict (household_id, name, type) do nothing;
