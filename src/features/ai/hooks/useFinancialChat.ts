import { useEffect, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { askFinancialAssistant } from "../services/aiService"
import { useAiMessages } from "./useAiMessages"

import type { AiMessage } from "../types"

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
        return
      }

      const assistantMessageId = `${Date.now()}-assistant`
      preserveMessages.current = !variables.selectedConversationId
      onConversationCreated(response.conversationId)
      setRevealMessageId(assistantMessageId)
      setMessages((current) => [
        ...current,
        {
          id: assistantMessageId,
          conversationId: response.conversationId,
          role: "assistant",
          content: response.answer,
          createdAt: new Date().toISOString(),
        },
      ])

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
  })

  function sendMessage(message: string) {
    const trimmedMessage = message.trim()
    if (!householdId || !trimmedMessage || mutation.isPending) {
      return false
    }

    const selectedConversationId = conversationId ?? undefined
    const optimisticMessageId = `${Date.now()}-user`
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
    ])
    mutation.mutate({
      householdId,
      message: trimmedMessage,
      selectedConversationId,
      optimisticMessageId,
    })
    return true
  }

  function retry() {
    if (!householdId || mutation.isPending) return
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")
    if (!lastUserMessage) return

    setRevealMessageId(null)
    mutation.mutate({
      householdId,
      message: lastUserMessage.content,
      selectedConversationId: conversationId ?? undefined,
      optimisticMessageId: lastUserMessage.id,
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

function isOptimisticMessageId(id: string) {
  return id.endsWith("-user") || id.endsWith("-assistant")
}
