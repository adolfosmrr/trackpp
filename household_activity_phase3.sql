-- Run this script manually after household_activity_phase2.sql.

create or replace function public.accept_household_invitation(
  p_invitation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_user_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_invitation public.household_invitations;
  v_household_name text;
  v_existing_membership public.household_members;
  v_membership_created boolean := false;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if v_user_email = '' then
    raise exception 'Authenticated user has no email';
  end if;

  select * into v_invitation
    from public.household_invitations
    where id = p_invitation_id
    for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Invitation is no longer pending';
  end if;

  if lower(trim(v_invitation.email)) <> v_user_email then
    raise exception 'This invitation belongs to another user';
  end if;

  select h.name into v_household_name
    from public.households h
    where h.id = v_invitation.household_id;

  if not found then
    raise exception 'Household not found';
  end if;

  select * into v_existing_membership
    from public.household_members
    where household_id = v_invitation.household_id
      and user_id = v_actor_id
    for update;

  if not found then
    insert into public.household_members (
      household_id,
      user_id,
      role
    )
    values (
      v_invitation.household_id,
      v_actor_id,
      'member'
    );

    insert into public.household_activity (
      household_id,
      actor_id,
      type,
      entity_type,
      entity_id,
      metadata
    )
    values (
      v_invitation.household_id,
      v_actor_id,
      'member_joined',
      'member',
      null,
      jsonb_build_object('householdName', v_household_name)
    );

    v_membership_created := true;
  end if;

  update public.household_invitations
    set status = 'accepted',
        accepted_at = now()
    where id = v_invitation.id;

  return jsonb_build_object(
    'success', true,
    'householdId', v_invitation.household_id,
    'membershipCreated', v_membership_created
  );
end;
$$;

revoke execute on function public.accept_household_invitation(uuid)
  from public, anon;
grant execute on function public.accept_household_invitation(uuid)
  to authenticated;
