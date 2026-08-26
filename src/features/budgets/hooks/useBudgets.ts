import { useQuery } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { getBudgets } from "../services/budgetService"

export function useBudgets() {
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  const month = getCurrentMonth()

  return useQuery({
    queryKey: [
      "budgets",
      selectedHouseholdId,
      month,
    ],

    queryFn: () =>
      getBudgets(
        selectedHouseholdId!,
        month
      ),

    enabled: !!selectedHouseholdId,
  })
}

export function getCurrentMonth() {
  const now = new Date()

  const year = now.getFullYear()

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0")

  return `${year}-${month}-01`
}