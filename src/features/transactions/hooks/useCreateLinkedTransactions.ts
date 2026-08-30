import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"

import { createLinkedTransactions } from "../services/transactionService"

import type { CreateLinkedTransactionsInput } from "../types"

export function useCreateLinkedTransactions() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (variables: CreateLinkedTransactionsInput) => {
      if (!user) {
        throw new Error("Usuario no autenticado.")
      }

      return createLinkedTransactions(variables)
    },
    onSuccess: (_data, variables) => {
      const householdIds = new Set(
        variables.targets.map((target) => target.householdId)
      )

      for (const householdId of householdIds) {
        void queryClient.invalidateQueries({
          queryKey: ["transactions", householdId],
        })
        void queryClient.invalidateQueries({
          queryKey: ["dashboard", householdId],
        })
        void queryClient.invalidateQueries({
          queryKey: ["dashboard-insights", householdId],
        })
        void queryClient.invalidateQueries({
          queryKey: ["budgets", householdId],
        })
        void queryClient.invalidateQueries({
          queryKey: ["activity", householdId],
        })
      }
    },
  })
}
