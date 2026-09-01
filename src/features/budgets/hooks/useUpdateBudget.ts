import {
    useMutation,
    useQueryClient,
  } from "@tanstack/react-query"
  
import { useHouseholdStore } from "../../../store/householdStore"
import { updateBudget } from "../services/budgetService"
import { getCurrentMonth } from "./useBudgets"
import type { UpdateBudgetInput } from "../types"

  export function useUpdateBudget() {
    const queryClient = useQueryClient()
  
    const selectedHouseholdId =
      useHouseholdStore(
        (state) => state.selectedHouseholdId
      )
  
    const month = getCurrentMonth()
  
    return useMutation({
      mutationFn: ({
        budgetId,
        amount,
        name,
      }: UpdateBudgetInput) =>
        updateBudget(budgetId, amount, month, name),
  
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "budgets",
            selectedHouseholdId,
            month,
          ],
        })
        queryClient.invalidateQueries({
          queryKey: ["budgets", selectedHouseholdId],
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
            "activity",
            selectedHouseholdId,
          ],
        })
      },
    })
  }
