import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { useHouseholdStore } from "../../../store/householdStore"
import { getFixedExpenses } from "../services/fixedExpenseService"

export function useFixedExpenses() {
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  const query = useQuery({
    queryKey: ["fixed-expenses", householdId],
    queryFn: () => getFixedExpenses(householdId!),
    enabled: Boolean(householdId),
  })

  useEffect(() => {
    if (__DEV__ && query.error) {
      console.error("[FixedExpenses] load error", query.error)
    }
  }, [query.error])

  return query
}
