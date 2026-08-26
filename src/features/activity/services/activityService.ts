import { supabase } from "../../../services/supabase"

import type { ActivityItem } from "../types"

const ACTIVITY_QUERY_LIMIT = 20

export async function getHouseholdActivity(
  householdId: string
): Promise<ActivityItem[]> {
  const { data, error } = await supabase
    .from("household_activity")
    .select(`
      id,
      household_id,
      actor_id,
      type,
      entity_type,
      entity_id,
      metadata,
      created_at,
      actor:profiles!household_activity_actor_id_fkey(
        id,
        name,
        avatar_url
      )
    `)
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(ACTIVITY_QUERY_LIMIT)

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as ActivityItem[]
}
