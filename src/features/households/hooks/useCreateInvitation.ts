import { useMutation } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { createHouseholdInvitation } from "../services/invitationService"

export function useCreateInvitation() {
  const selectedHouseholdId =
    useHouseholdStore(
      (state) => state.selectedHouseholdId
    )

  return useMutation({
    mutationFn: async (email: string) => {
      if (!selectedHouseholdId) {
        throw new Error(
          "No hay un espacio seleccionado."
        )
      }

      return createHouseholdInvitation(
        selectedHouseholdId,
        email
      )
    },
  })
}