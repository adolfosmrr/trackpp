import { useHouseholdStore } from "../../../store/householdStore"

import { useHouseholdCategories } from "./useHouseholdCategories"

import type { CategoryType } from "../types"

export function useCategories(type: CategoryType, enabled = true) {
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useHouseholdCategories(selectedHouseholdId, type, enabled)
}
