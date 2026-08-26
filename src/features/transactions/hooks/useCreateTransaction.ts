import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"
import { useHouseholdStore } from "../../../store/householdStore"

import { createTransaction } from "../services/transactionService"

import type { TransactionType } from "../types"

type CreateTransactionValues = {
    type: TransactionType
    title: string
    amount: number
    categoryId?: string
    description?: string
}

export function useCreateTransaction() {
    const queryClient = useQueryClient()

    const { user } = useAuth()

    const selectedHouseholdId = useHouseholdStore(
        (state) => state.selectedHouseholdId
    )

    return useMutation({
        mutationFn: async (values: CreateTransactionValues) => {
            if (!user) {
                throw new Error("Usuario no autenticado.")
            }

            if (!selectedHouseholdId) {
                throw new Error("No hay un espacio seleccionado.")
            }

            return createTransaction({
                householdId: selectedHouseholdId,
                userId: user.id,
                ...values,
            })
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
