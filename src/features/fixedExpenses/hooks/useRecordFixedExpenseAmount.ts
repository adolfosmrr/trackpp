import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { recordFixedExpenseAmount } from "../services/fixedExpenseService"
import { invalidateFixedExpenseQueries } from "./fixedExpenseQueryInvalidation"

export function useRecordFixedExpenseAmount() {
  const queryClient = useQueryClient()
  const householdId = useHouseholdStore((state) => state.selectedHouseholdId)

  return useMutation({
    mutationFn: recordFixedExpenseAmount,
    onSuccess: () => {
      invalidateFixedExpenseQueries(queryClient, householdId)
    },
  })
}
