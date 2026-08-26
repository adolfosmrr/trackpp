import { useQuery } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"

import { getCategories } from "../services/categoryService"

import type { CategoryType } from "../types"

export function useCategories(type: CategoryType) {
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useQuery({
    queryKey: ["categories", selectedHouseholdId, type],

    queryFn: () => getCategories(selectedHouseholdId!, type),

    enabled: !!selectedHouseholdId,
  })
}
