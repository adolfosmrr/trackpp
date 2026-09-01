import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { deleteAiConversation } from "../services/aiService"

export function useDeleteAiConversation() {
  const queryClient = useQueryClient()
  const householdId = useHouseholdStore((state) => state.selectedHouseholdId)

  return useMutation({
    mutationFn: (conversationId: string) => deleteAiConversation(conversationId),
    onSuccess: (_data, conversationId) => {
      void queryClient.invalidateQueries({
        queryKey: ["ai-conversations", householdId],
      })
      queryClient.removeQueries({
        queryKey: ["ai-messages", conversationId],
      })
    },
  })
}
