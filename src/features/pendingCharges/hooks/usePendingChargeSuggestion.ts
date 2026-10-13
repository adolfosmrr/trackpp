import { useQuery } from "@tanstack/react-query"

import { getPendingChargeSuggestion } from "../services/pendingChargeService"

export function usePendingChargeSuggestion(chargeId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["pending-charge-suggestion", chargeId],
    queryFn: () => {
      if (!chargeId) {
        throw new Error("Falta el gasto de tarjeta.")
      }
      return getPendingChargeSuggestion(chargeId)
    },
    enabled: Boolean(chargeId) && enabled,
  })
}
