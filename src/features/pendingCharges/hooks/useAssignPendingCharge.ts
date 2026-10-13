import { useMutation, useQueryClient } from "@tanstack/react-query"

import { assignPendingCharge } from "../services/pendingChargeService"
import {
  invalidateHouseholdTransactionQueries,
  invalidatePendingCharges,
} from "./invalidateChargeQueries"

export function useAssignPendingCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignPendingCharge,
    onSuccess: (_result, variables) => {
      invalidatePendingCharges(queryClient)
      invalidateHouseholdTransactionQueries(queryClient, variables.householdId)
    },
  })
}
