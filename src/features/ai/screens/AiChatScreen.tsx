import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { useHouseholdStore } from "../../../store/householdStore"
import { ApiError } from "../../../services/api"
import { useAiConversations } from "../hooks/useAiConversations"
import { useFinancialChat } from "../hooks/useFinancialChat"

const suggestions = [
  "¿Qué gastos fijos tengo pendientes?",
  "¿Qué vence esta semana?",
  "¿Cuánto me queda por pagar este mes?",
  "¿Cuánto gastamos el mes pasado?",
  "¿Gastamos más que el mes anterior?",
  "¿Cómo evolucionó comida en 3 meses?",
]

export function AiChatScreen() {
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )
  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null)
  const [shouldSelectRecent, setShouldSelectRecent] = useState(true)
  const [input, setInput] = useState("")
  const { data: conversations, isLoading: conversationsLoading } =
    useAiConversations()

  useEffect(() => {
    setActiveConversationId(null)
    setShouldSelectRecent(true)
  }, [householdId])

  useEffect(() => {
    if (
      shouldSelectRecent &&
      conversations &&
      conversations.length > 0
    ) {
      setActiveConversationId(conversations[0].id)
      setShouldSelectRecent(false)
    }
  }, [conversations, shouldSelectRecent])

  const {
    messages,
    sendMessage,
    isPending,
    error,
    isLoadingMessages,
  } = useFinancialChat(
    activeConversationId,
    setActiveConversationId
  )
  const errorMessage =
    error instanceof ApiError &&
    error.code === "AI_DAILY_LIMIT_REACHED"
      ? "Estás haciendo demasiadas preguntas. Intenta nuevamente en un momento."
      : "No se pudo obtener una respuesta. Inténtalo de nuevo."

  function handleSend() {
    if (sendMessage(input)) {
      setInput("")
    }
  }

  function handleNewConversation() {
    setActiveConversationId(null)
    setShouldSelectRecent(false)
    setInput("")
  }

  return (
    <View style={styles.container}>
      <View style={styles.conversationsHeader}>
        <Text style={styles.heading}>Conversaciones</Text>
        <Pressable
          style={styles.newButton}
          onPress={handleNewConversation}
          disabled={isPending}
        >
          <Text style={styles.newButtonText}>Nueva conversación</Text>
        </Pressable>
      </View>

      {conversationsLoading ? (
        <ActivityIndicator style={styles.conversationsLoading} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.conversations}
        >
          {conversations?.map((conversation) => (
            <Pressable
              key={conversation.id}
              style={[
                styles.conversation,
                conversation.id === activeConversationId &&
                  styles.conversationSelected,
              ]}
              onPress={() => {
                setShouldSelectRecent(false)
                setActiveConversationId(conversation.id)
              }}
              disabled={isPending}
            >
              <Text
                style={[
                  styles.conversationText,
                  conversation.id === activeConversationId &&
                    styles.conversationTextSelected,
                ]}
                numberOfLines={1}
              >
                {conversation.title ?? "Sin título"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {!activeConversationId && !messages.length && (
          <View style={styles.emptyState}>
            <Text style={styles.subtitle}>
              Pregunta sobre los movimientos y presupuestos del espacio seleccionado.
            </Text>

            <View style={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  style={styles.suggestion}
                  onPress={() => {
                    setInput(suggestion)
                    sendMessage(suggestion)
                  }}
                  disabled={isPending || !householdId}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {isLoadingMessages && activeConversationId && (
          <ActivityIndicator />
        )}

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.message,
              message.role === "user"
                ? styles.userMessage
                : styles.assistantMessage,
            ]}
          >
            <Text style={styles.messageRole}>
              {message.role === "user" ? "Tú" : "IA"}
            </Text>
            <Text
              style={
                message.role === "user"
                  ? styles.userMessageContent
                  : styles.messageContent
              }
            >
              {message.content}
            </Text>
          </View>
        ))}

        {isPending && (
          <View style={styles.thinking}>
            <ActivityIndicator size="small" />
            <Text>Pensando...</Text>
          </View>
        )}

        {error && (
          <Text style={styles.error}>{errorMessage}</Text>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta algo sobre tus finanzas"
          multiline
          maxLength={500}
          editable={!isPending && Boolean(householdId)}
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={[
            styles.sendButton,
            (!input.trim() || isPending || !householdId) && styles.disabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isPending || !householdId}
        >
          <Text style={styles.sendText}>Enviar</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  conversationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  heading: { fontSize: 16, fontWeight: "700" },
  newButton: { paddingVertical: 8 },
  newButtonText: { fontWeight: "700", color: "#111" },
  conversationsLoading: { margin: 12 },
  conversations: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  conversation: {
    maxWidth: 220,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  conversationSelected: { backgroundColor: "#111", borderColor: "#111" },
  conversationText: { fontSize: 13 },
  conversationTextSelected: { color: "#fff" },
  messages: { flex: 1 },
  messagesContent: { padding: 20, gap: 12 },
  emptyState: { gap: 16 },
  subtitle: { color: "#777", lineHeight: 21 },
  suggestions: { gap: 10 },
  suggestion: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 13,
  },
  suggestionText: { fontWeight: "600" },
  message: {
    maxWidth: "88%",
    borderRadius: 14,
    padding: 13,
    gap: 4,
  },
  userMessage: { alignSelf: "flex-end", backgroundColor: "#111" },
  assistantMessage: { alignSelf: "flex-start", backgroundColor: "#f1f1f1" },
  messageRole: { fontSize: 12, fontWeight: "700", color: "#777" },
  messageContent: { lineHeight: 21 },
  userMessageContent: { lineHeight: 21, color: "#fff" },
  thinking: { flexDirection: "row", alignItems: "center", gap: 8 },
  error: { color: "#b42318" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disabled: { opacity: 0.4 },
  sendText: { color: "#fff", fontWeight: "700" },
})
