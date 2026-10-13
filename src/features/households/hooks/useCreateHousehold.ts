import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"

import {
  createHousehold,
  type CreateHouseholdInput,
} from "../services/householdService"

export function useCreateHousehold() {
  const queryClient =
    useQueryClient()

  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateHouseholdInput) => {
      if (!user) {
        throw new Error(
          "Usuario no autenticado."
        )
      }

      return createHousehold(input)
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