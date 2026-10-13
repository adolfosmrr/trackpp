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

export async function createCategory(input: {
  householdId: string
  name: string
  icon: string | null
  type: CategoryType
}): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      household_id: input.householdId,
      name: input.name,
      icon: input.icon,
      type: input.type,
      is_default: false,
    })
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return data as Category
}
