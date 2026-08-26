import { useQuery } from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"
import { getInvitations } from "../services/invitationService"

export function useInvitations() {
  const { user } =
    useAuth()

  return useQuery({
    queryKey: [
      "invitations",
      user?.id,
    ],

    queryFn:
      getInvitations,

    enabled:
      !!user,
  })
}