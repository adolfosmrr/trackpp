import { useEffect, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { askFinancialAssistant } from "../services/aiService"
import { useAiMessages } from "./useAiMessages"

import type { AiMessage } from "../types"

export const THINKING_PLACEHOLDER = "Trabajando…"

export function useFinancialChat(
  conversationId: string | null,
  onConversationCreated: (conversationId: string) => void
) {
  const queryClient = useQueryClient()
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [revealMessageId, setRevealMessageId] = useState<string | null>(null)
  const preserveMessages = useRef(false)
  const persistedMessagesQuery = useAiMessages(conversationId)

  useEffect(() => {
    if (preserveMessages.current) {
      preserveMessages.current = false
      return
    }
    setMessages([])
    setRevealMessageId(null)
  }, [conversationId, householdId])

  useEffect(() => {
    if (!conversationId || !persistedMessagesQuery.data) return
    setMessages((current) => {
      if (current.some((message) => isOptimisticMessageId(message.id))) return current
      return persistedMessagesQuery.data
    })
  }, [conversationId, persistedMessagesQuery.data])

  const mutation = useMutation({
    mutationFn: ({
      householdId,
      message,
      selectedConversationId,
      optimisticMessageId,
    }: {
      householdId: string
      message: string
      selectedConversationId: string | undefined
      optimisticMessageId: string
      thinkingMessageId: string
    }) =>
      askFinancialAssistant(
        householdId,
        message,
        selectedConversationId
      ),
    onSuccess: (response, variables) => {
      if (
        !householdId ||
        variables.householdId !== householdId ||
        (variables.selectedConversationId &&
          variables.selectedConversationId !== conversationId)
      ) {
        setMessages((current) =>
          current.filter((message) => message.id !== variables.thinkingMessageId)
        )
        return
      }

      const assistantMessage: AiMessage = {
        id: `${Date.now()}-assistant`,
        conversationId: response.conversationId,
        role: "assistant",
        content: response.answer,
        createdAt: new Date().toISOString(),
      }
      preserveMessages.current = !variables.selectedConversationId
      onConversationCreated(response.conversationId)
      setRevealMessageId(assistantMessage.id)
      setMessages((current) => {
        const index = current.findIndex(
          (message) => message.id === variables.thinkingMessageId
        )
        if (index === -1) return [...current, assistantMessage]
        return current.map((message, messageIndex) =>
          messageIndex === index ? assistantMessage : message
        )
      })

      void queryClient.invalidateQueries({
        queryKey: [
          "ai-messages",
          response.conversationId,
        ],
      })
      void queryClient.invalidateQueries({
        queryKey: ["ai-conversations", householdId],
      })
    },
    onError: (_error, variables) => {
      setMessages((current) =>
        current.filter((message) => message.id !== variables.thinkingMessageId)
      )
    },
  })

  function sendMessage(message: string) {
    const trimmedMessage = message.trim()
    if (!householdId || !trimmedMessage || mutation.isPending) {
      return false
    }

    const selectedConversationId = conversationId ?? undefined
    const stamp = Date.now()
    const optimisticMessageId = `${stamp}-user`
    const thinkingMessageId = `${stamp}-thinking`
    setRevealMessageId(null)
    setMessages((current) => [
      ...current,
      {
        id: optimisticMessageId,
        conversationId: selectedConversationId ?? "pending",
        role: "user",
        content: trimmedMessage,
        createdAt: new Date().toISOString(),
      },
      thinkingBubble(thinkingMessageId, selectedConversationId ?? "pending"),
    ])
    mutation.mutate({
      householdId,
      message: trimmedMessage,
      selectedConversationId,
      optimisticMessageId,
      thinkingMessageId,
    })
    return true
  }

  function retry() {
    if (!householdId || mutation.isPending) return
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")
    if (!lastUserMessage) return

    const thinkingMessageId = `${Date.now()}-thinking`
    setRevealMessageId(null)
    setMessages((current) => [
      ...current.filter((message) => !message.pending),
      thinkingBubble(thinkingMessageId, conversationId ?? "pending"),
    ])
    mutation.mutate({
      householdId,
      message: lastUserMessage.content,
      selectedConversationId: conversationId ?? undefined,
      optimisticMessageId: lastUserMessage.id,
      thinkingMessageId,
    })
  }

  function completeReveal() {
    setRevealMessageId(null)
  }

  return {
    messages,
    sendMessage,
    retry,
    revealMessageId,
    completeReveal,
    isPending: mutation.isPending,
    error: mutation.error,
    isLoadingMessages: persistedMessagesQuery.isLoading,
  }
}

function thinkingBubble(id: string, conversationId: string): AiMessage {
  return {
    id,
    conversationId,
    role: "assistant",
    content: THINKING_PLACEHOLDER,
    createdAt: new Date().toISOString(),
    pending: true,
  }
}

function isOptimisticMessageId(id: string) {
  return id.endsWith("-user") || id.endsWith("-assistant") || id.endsWith("-thinking")
}
