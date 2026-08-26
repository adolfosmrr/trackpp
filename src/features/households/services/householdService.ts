import { supabase } from "../../../services/supabase"
import { apiFetch } from "../../../services/api"

import type { HouseholdMembership } from "../types"

export async function getUserHouseholds(
  userId: string
): Promise<HouseholdMembership[]> {
  const { data, error } = await supabase
    .from("household_members")
    .select(`
      id,
      household_id,
      user_id,
      role,
      joined_at,
      household:households (
        id,
        name,
        type,
        currency,
        created_by,
        created_at
      )
    `)
    .eq("user_id", userId)

  if (error) {
    throw error
  }

  return data as unknown as HouseholdMembership[]
}

export async function createHousehold({
  name,
  currency,
}: {
  name: string
  currency: string
}) {
  const response = await apiFetch(
    "/households",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        currency,
      }),
    }
  )

  return response.household
}
