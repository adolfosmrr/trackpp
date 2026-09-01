import {
    useMutation,
    useQueryClient,
  } from "@tanstack/react-query"
  
  import { useHouseholdStore } from "../../../store/householdStore"
  import { deleteBudget } from "../services/budgetService"
  import { getCurrentMonth } from "./useBudgets"
  
  export function useDeleteBudget() {
    const queryClient = useQueryClient()
  
    const selectedHouseholdId =
      useHouseholdStore(
        (state) => state.selectedHouseholdId
      )
  
    const month = getCurrentMonth()
  
    return useMutation({
      mutationFn: (budgetId: string) => deleteBudget(budgetId, month),
  
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
