import { supabase } from "../../../services/supabase"

export async function getUnreadActivityCount(
  householdId: string
): Promise<number> {
  const { data, error } = await supabase.rpc(
    "get_unread_household_activity_count",
    {
      p_household_id: householdId,
    }
  )

  if (error) {
    throw error
  }

  return Number(data ?? 0)
}

export async function markHouseholdActivitySeen(
  householdId: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "mark_household_activity_seen",
    {
      p_household_id: householdId,
    }
  )

  if (error) {
    throw error
  }
}
