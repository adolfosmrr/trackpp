import {
    useMutation,
    useQueryClient,
  } from "@tanstack/react-query"
  
  import { useHouseholdStore } from "../../../store/householdStore"
  import { updateBudget } from "../services/budgetService"
  import { getCurrentMonth } from "./useBudgets"
  
  type UpdateBudgetValues = {
    budgetId: string
    amount: number
  }
  
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
      }: UpdateBudgetValues) =>
        updateBudget(budgetId, amount, month),
  
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
