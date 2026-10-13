-- Additive. profiles already has name, avatar_url, currency and timezone.
-- Birth date and alias are new. Alias is stored lowercase.
-- Uniqueness uses a partial index on lower(alias), not citext:
-- citext is not installed, and several null aliases must be allowed.
--
-- Row security is already enabled. "Users can update own profile"
-- allows UPDATE only where auth.uid() = id (WITH CHECK falls back to
-- USING). New columns use that policy. The block below creates it
-- only when a database is missing it.
--
-- Not applied. Apply this file once after review.

alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists alias text;

alter table public.profiles
  drop constraint if exists profiles_alias_format_check;

alter table public.profiles
  add constraint profiles_alias_format_check
  check (
    alias is null
    or alias ~ '^[a-z][a-z0-9_]{2,19}$'
  );

alter table public.profiles
  drop constraint if exists profiles_birth_date_check;

alter table public.profiles
  add constraint profiles_birth_date_check
  check (birth_date is null or birth_date <= current_date);

create unique index if not exists profiles_alias_lower_key
  on public.profiles (lower(alias))
  where alias is not null;

do $$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.profiles'::regclass
      and polname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end
$$;
