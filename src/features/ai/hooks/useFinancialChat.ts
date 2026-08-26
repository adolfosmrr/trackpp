import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { ApiError } from "../../../services/api"
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
  const persistedMessagesQuery = useAiMessages(conversationId)

  useEffect(() => {
    setMessages([])
  }, [conversationId, householdId])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
    } else if (persistedMessagesQuery.data) {
      setMessages(persistedMessagesQuery.data)
    }
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

      onConversationCreated(response.conversationId)
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
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
    onError: (error, variables) => {
      if (
        error instanceof ApiError &&
        (error.code === "AI_DAILY_LIMIT_REACHED" ||
          error.status === 400 ||
          error.status === 429)
      ) {
        setMessages((current) =>
          current.filter(
            (message) => message.id !== variables.optimisticMessageId
          )
        )
      }
    },
  })

  function sendMessage(message: string) {
    const trimmedMessage = message.trim()
    if (!householdId || !trimmedMessage || mutation.isPending) {
      return false
    }

    const selectedConversationId = conversationId ?? undefined
    const optimisticMessageId = `${Date.now()}-user`
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

  return {
    messages,
    sendMessage,
    isPending: mutation.isPending,
    error: mutation.error,
    isLoadingMessages: persistedMessagesQuery.isLoading,
  }
}
