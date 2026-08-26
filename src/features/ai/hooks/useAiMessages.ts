import { useQuery } from "@tanstack/react-query"

import { getAiMessages } from "../services/aiService"

export function useAiMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["ai-messages", conversationId],
    queryFn: () => getAiMessages(conversationId!),
    enabled: Boolean(conversationId),
  })
}
