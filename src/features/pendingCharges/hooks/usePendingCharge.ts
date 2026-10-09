import { useQuery } from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"
import { getPendingCharge } from "../services/pendingChargeService"

export function usePendingCharge(chargeId: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["pending-charges", user?.id, chargeId],
    queryFn: () => getPendingCharge(chargeId!),
    enabled: !!user && !!chargeId,
  })
}
