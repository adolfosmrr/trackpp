import { supabase } from "../../../services/supabase"

import { DEFAULT_CATEGORY_ICON } from "../constants"

import type { Category, CategoryType } from "../types"

export async function getCategories(
  householdId: string,
  type?: CategoryType
): Promise<Category[]> {
  let query = supabase
    .from("categories")
    .select("*")
    .eq("household_id", householdId)

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data as Category[]).sort(compareCategories)
}

function compareCategories(left: Category, right: Category) {
  if (left.is_default !== right.is_default) {
    return left.is_default ? 1 : -1
  }

  if (!left.is_default) {
    const byAge = right.created_at.localeCompare(left.created_at)
    if (byAge !== 0) return byAge
  }

  return left.name.localeCompare(right.name, "es")
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
      icon: input.icon?.trim() ? input.icon : DEFAULT_CATEGORY_ICON,
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
