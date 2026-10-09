import { useMutation, useQueryClient } from "@tanstack/react-query"

import { dismissPendingCharge } from "../services/pendingChargeService"
import { invalidatePendingCharges } from "./invalidateChargeQueries"

export function useDismissPendingCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dismissPendingCharge,
    onSuccess: () => {
      invalidatePendingCharges(queryClient)
    },
  })
}
