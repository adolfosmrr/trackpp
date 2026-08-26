import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { deleteFixedExpense } from "../services/fixedExpenseService"

export function useDeleteFixedExpense() {
  const queryClient = useQueryClient()
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useMutation({
    mutationFn: deleteFixedExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["fixed-expenses", householdId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["fixed-expense-periods", householdId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["fixed-expense-reminders", householdId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["activity", householdId],
      })
    },
  })
}
