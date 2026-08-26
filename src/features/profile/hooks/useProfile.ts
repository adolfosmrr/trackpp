import { useQuery } from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"
import { getProfile } from "../services/profileService"

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  })
}