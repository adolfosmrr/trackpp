import { useQuery } from "@tanstack/react-query"

import { useAuth } from "../context/AuthContext"
import { getMe } from "../services/meService"

export function useMe() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["me", user?.id],
    queryFn: getMe,
    enabled: !!user,
  })
}