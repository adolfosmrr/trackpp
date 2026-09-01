import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { useHouseholdStore } from "../../../store/householdStore"
import {
  getFixedExpensePeriods,
} from "../services/fixedExpenseService"

export function getCurrentFixedExpensePeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

export function useFixedExpensePeriods(
  enabled = true,
  requestedPeriod = getCurrentFixedExpensePeriod()
) {
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  const query = useQuery({
    queryKey: ["fixed-expense-periods", householdId, requestedPeriod],
    queryFn: () => getFixedExpensePeriods(householdId!, requestedPeriod),
    enabled: Boolean(householdId) && enabled,
  })

  useEffect(() => {
    if (__DEV__ && query.error) {
      console.error("[FixedExpenses] periods load error", query.error)
    }
  }, [query.error])

  return query
}
