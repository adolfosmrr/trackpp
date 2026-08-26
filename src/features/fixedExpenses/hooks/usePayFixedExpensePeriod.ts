import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import {
  payFixedExpensePeriod,
} from "../services/fixedExpenseService"
import { invalidateFixedExpenseQueries } from "./fixedExpenseQueryInvalidation"

export function usePayFixedExpensePeriod() {
  const queryClient = useQueryClient()
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )
  return useMutation({
    mutationFn: ({ periodId, amount }: { periodId: string; amount: number }) =>
      payFixedExpensePeriod(periodId, amount),
    onSuccess: () => {
      invalidateFixedExpenseQueries(queryClient, householdId)
    },
  })
}
