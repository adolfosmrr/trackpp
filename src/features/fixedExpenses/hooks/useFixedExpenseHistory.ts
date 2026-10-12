import { useQuery } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { getFixedExpenseHistory } from "../services/fixedExpenseService"

export function useFixedExpenseHistory(fixedExpenseId: string | undefined) {
  const householdId = useHouseholdStore((state) => state.selectedHouseholdId)

  return useQuery({
    queryKey: ["fixed-expense-history", householdId, fixedExpenseId],
    queryFn: () => {
      if (!fixedExpenseId) {
        throw new Error("Falta el gasto fijo.")
      }
      return getFixedExpenseHistory(fixedExpenseId)
    },
    enabled: Boolean(householdId && fixedExpenseId),
  })
}
