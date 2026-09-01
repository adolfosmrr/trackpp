import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import {
  updateFixedExpense,
} from "../services/fixedExpenseService"
import type { FixedExpenseInput } from "../types"

type UpdateValues = FixedExpenseInput & {
  fixedExpenseId: string
  period: string
}

export function useUpdateFixedExpense() {
  const queryClient = useQueryClient()
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useMutation({
    mutationFn: ({ fixedExpenseId, period, ...input }: UpdateValues) =>
      updateFixedExpense(fixedExpenseId, input, period),
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
