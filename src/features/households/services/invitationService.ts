import { apiFetch } from "../../../services/api"

import type {
  HouseholdInvitation,
} from "../types/invitation"

export async function createHouseholdInvitation(
  householdId: string,
  email: string
) {
  return apiFetch(
    `/households/${householdId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    }
  )
}

export async function getInvitations(): Promise<
  HouseholdInvitation[]
> {
  const response =
    await apiFetch(
      "/invitations"
    )

  return response.invitations
}

export async function acceptInvitation(
  invitationId: string
) {
  console.log(
    "[Invitations] Accepting invitation:",
    invitationId
  )

  return apiFetch(
    `/invitations/${invitationId}/accept`,
    {
      method: "POST",
    }
  )
}
