import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateFixedExpenseQueries } from "../../fixedExpenses/hooks/fixedExpenseQueryInvalidation"
import { linkPendingChargeToFixedExpense } from "../services/pendingChargeService"
import {
  invalidateHouseholdTransactionQueries,
  invalidatePendingCharges,
} from "./invalidateChargeQueries"

export function useLinkPendingCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: linkPendingChargeToFixedExpense,
    onSuccess: (result, variables) => {
      invalidatePendingCharges(queryClient)
      invalidateHouseholdTransactionQueries(queryClient, result.householdId)
      invalidateFixedExpenseQueries(queryClient, result.householdId)
      void queryClient.invalidateQueries({
        queryKey: ["pending-charge-suggestion", variables.chargeId],
      })
    },
  })
}
