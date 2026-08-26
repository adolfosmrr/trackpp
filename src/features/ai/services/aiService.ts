import { apiFetch } from "../../../services/api"

import type { AiConversation, AiMessage } from "../types"

type FinancialChatResponse = {
  conversationId: string
  answer: string
  period: string
  usage?: {
    limit: number
    remaining: number
  }
}

export async function askFinancialAssistant(
  householdId: string,
  message: string,
  conversationId?: string
) {
  return apiFetch<FinancialChatResponse>(
    "/ai/chat",
    {
      method: "POST",
      body: JSON.stringify({
        householdId,
        conversationId,
        message,
      }),
    }
  )
}

export function getAiConversations(householdId: string) {
  return apiFetch<AiConversation[]>(
    `/ai/conversations?householdId=${encodeURIComponent(householdId)}`
  )
}

export function getAiMessages(conversationId: string) {
  return apiFetch<AiMessage[]>(
    `/ai/conversations/${encodeURIComponent(conversationId)}/messages`
  )
}
