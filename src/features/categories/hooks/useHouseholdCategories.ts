import { useQuery } from "@tanstack/react-query"

import { getCategories } from "../services/categoryService"

import type { CategoryType } from "../types"

export function useHouseholdCategories(
  householdId: string | null,
  type: CategoryType,
  enabled = true,
) {
  return useQuery({
    queryKey: ["categories", householdId, type],
    queryFn: () => getCategories(householdId!, type),
    enabled: Boolean(householdId) && enabled,
  })
}
