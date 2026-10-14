-- Not applied. profiles.name stays the given name. Surname is a separate
-- column so existing rows keep a single name until the person fills it in.

alter table public.profiles
  add column if not exists last_name text;

alter table public.profiles
  drop constraint if exists profiles_last_name_length_check;

alter table public.profiles
  add constraint profiles_last_name_length_check
  check (
    last_name is null
    or char_length(btrim(last_name)) between 1 and 80
  );
