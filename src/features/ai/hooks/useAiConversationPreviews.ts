import { useQueries } from "@tanstack/react-query"

import { getAiMessages } from "../services/aiService"
import type { AiConversation } from "../types"

export function useAiConversationPreviews(
  conversations: AiConversation[] | undefined
) {
  const queries = useQueries({
    queries: (conversations ?? []).map((conversation) => ({
      queryKey: ["ai-messages", conversation.id],
      queryFn: () => getAiMessages(conversation.id),
      select: (messages: Awaited<ReturnType<typeof getAiMessages>>) =>
        messages.find((message) => message.role === "user")?.content ?? null,
    })),
  })

  return {
    previews: queries.map((query) => query.data ?? null),
    isLoading: queries.some((query) => query.isLoading),
  }
}
