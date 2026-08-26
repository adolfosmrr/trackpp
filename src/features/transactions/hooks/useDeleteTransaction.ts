import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"

import { deleteTransaction } from "../services/transactionService"

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useMutation({
    mutationFn: async (transactionId: string) => {
      if (!selectedHouseholdId) {
        throw new Error("No hay un espacio seleccionado.")
      }

      return deleteTransaction(transactionId)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "transactions",
          selectedHouseholdId,
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "dashboard",
          selectedHouseholdId,
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "dashboard-insights",
          selectedHouseholdId,
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "budgets",
          selectedHouseholdId,
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "activity",
          selectedHouseholdId,
        ],
      })
    },
  })
}
