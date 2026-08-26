import { supabase } from "../../../services/supabase"

import type { Category, CategoryType } from "../types"

export async function getCategories(
  householdId: string,
  type?: CategoryType
): Promise<Category[]> {
  let query = supabase
    .from("categories")
    .select("*")
    .eq("household_id", householdId)
    .order("name", {
      ascending: true,
    })

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data as Category[]
}
