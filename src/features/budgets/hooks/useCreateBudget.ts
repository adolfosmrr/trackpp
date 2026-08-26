import {
    useMutation,
    useQueryClient,
  } from "@tanstack/react-query"
  
  import { useAuth } from "../../auth/context/AuthContext"
  import { useHouseholdStore } from "../../../store/householdStore"
  
  import {
    createBudget,
  } from "../services/budgetService"
  
  import {
    getCurrentMonth,
  } from "./useBudgets"
  
  type CreateBudgetValues = {
    categoryId: string
    amount: number
  }
  
  export function useCreateBudget() {
    const queryClient = useQueryClient()
  
    const { user } = useAuth()
  
    const selectedHouseholdId =
      useHouseholdStore(
        (state) =>
          state.selectedHouseholdId
      )
  
    const month = getCurrentMonth()
  
    return useMutation({
      mutationFn: async (
        values: CreateBudgetValues
      ) => {
        if (!user) {
          throw new Error(
            "Usuario no autenticado."
          )
        }
  
        if (!selectedHouseholdId) {
          throw new Error(
            "No hay un espacio seleccionado."
          )
        }
  
        return createBudget({
          householdId:
            selectedHouseholdId,
          userId: user.id,
          categoryId:
            values.categoryId,
          amount:
            values.amount,
          month,
        })
      },
  
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "budgets",
            selectedHouseholdId,
            month,
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
            "activity",
            selectedHouseholdId,
          ],
        })
      },
    })
  }
