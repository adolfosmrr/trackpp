export type AiConversation = {
  id: string
  householdId: string
  title: string | null
  createdAt: string
  updatedAt: string
}

export type AiMessage = {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}
