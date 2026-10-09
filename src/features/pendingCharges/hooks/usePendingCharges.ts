import { useQuery } from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"
import { listPendingCharges } from "../services/pendingChargeService"

export function usePendingCharges() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["pending-charges", user?.id],
    queryFn: () => listPendingCharges(user!.id),
    enabled: !!user,
  })
}
