import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import {
  createFixedExpense,
} from "../services/fixedExpenseService"
import type { FixedExpenseInput } from "../types"

export function useCreateFixedExpense() {
  const queryClient = useQueryClient()
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useMutation({
    mutationFn: (input: FixedExpenseInput) => {
      if (!householdId) {
        throw new Error("No hay un espacio seleccionado.")
      }

      return createFixedExpense(householdId, input)
    },
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
