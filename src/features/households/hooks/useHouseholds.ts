import { useQuery } from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"
import { getUserHouseholds } from "../services/householdService"

export function useHouseholds() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["households", user?.id],

    queryFn: () =>
      getUserHouseholds(user!.id),

    enabled: !!user,
  })
}