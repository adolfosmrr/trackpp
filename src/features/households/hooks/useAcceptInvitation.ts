import {
    useMutation,
    useQueryClient,
  } from "@tanstack/react-query"
  
  import { useAuth } from "../../auth/context/AuthContext"
  
  import {
    acceptInvitation,
  } from "../services/invitationService"
  
  export function useAcceptInvitation() {
    const queryClient =
      useQueryClient()
  
    const { user } =
      useAuth()
  
    return useMutation({
      mutationFn:
        acceptInvitation,
  
      onSuccess: (response) => {
        queryClient.invalidateQueries({
          queryKey: [
            "invitations",
            user?.id,
          ],
        })
  
        queryClient.invalidateQueries({
          queryKey: [
            "households",
            user?.id,
          ],
        })

        if (response?.householdId) {
          queryClient.invalidateQueries({
            queryKey: [
              "activity",
              response.householdId,
            ],
          })
        }
      },
    })
  }
