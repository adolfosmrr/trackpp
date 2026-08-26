-- Run this script manually in the Supabase SQL Editor.

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  created_by uuid not null,
  title text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_conversations_household_id_fkey
    foreign key (household_id)
    references public.households(id)
    on delete cascade,
  constraint ai_conversations_created_by_fkey
    foreign key (created_by)
    references public.profiles(id)
    on delete cascade
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint ai_messages_conversation_id_fkey
    foreign key (conversation_id)
    references public.ai_conversations(id)
    on delete cascade,
  constraint ai_messages_role_check
    check (role in ('user', 'assistant'))
);

create index if not exists ai_conversations_household_updated_at_idx
  on public.ai_conversations (household_id, updated_at desc);

create index if not exists ai_messages_conversation_created_at_idx
  on public.ai_messages (conversation_id, created_at asc);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

revoke all on table public.ai_conversations
  from public, anon, authenticated;
revoke all on table public.ai_messages
  from public, anon, authenticated;

grant select on table public.ai_conversations to authenticated;
grant select on table public.ai_messages to authenticated;

drop policy if exists "Members can read AI conversations"
  on public.ai_conversations;

create policy "Members can read AI conversations"
  on public.ai_conversations
  for select
  to authenticated
  using (public.is_household_member(household_id));

drop policy if exists "Members can read AI messages"
  on public.ai_messages;

create policy "Members can read AI messages"
  on public.ai_messages
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.ai_conversations c
       where c.id = conversation_id
         and public.is_household_member(c.household_id)
    )
  );
