import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"
import { useProfile } from "../../profile/hooks/useProfile"

import {
  createHousehold,
} from "../services/householdService"

export function useCreateHousehold() {
  const queryClient =
    useQueryClient()

  const { user } = useAuth()

  const { data: profile } =
    useProfile()

  return useMutation({
    mutationFn: async (
      name: string
    ) => {
      if (!user) {
        throw new Error(
          "Usuario no autenticado."
        )
      }

      return createHousehold({
        name,
        currency:
          profile?.currency ??
          "ARS",
      })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "households",
          user?.id,
        ],
      })
    },
  })
}