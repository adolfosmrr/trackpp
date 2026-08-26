import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { updateFixedExpensePayment } from "../services/fixedExpenseService"
import { invalidateFixedExpenseQueries } from "./fixedExpenseQueryInvalidation"

export function useUpdateFixedExpensePayment() {
  const queryClient = useQueryClient()
  const householdId = useHouseholdStore((state) => state.selectedHouseholdId)

  return useMutation({
    mutationFn: ({ paymentId, amount }: { paymentId: string; amount: number }) =>
      updateFixedExpensePayment(paymentId, amount),
    onSuccess: () => {
      invalidateFixedExpenseQueries(queryClient, householdId)
    },
  })
}
