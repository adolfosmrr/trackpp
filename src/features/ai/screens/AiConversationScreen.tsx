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

import { ApiError } from "../../../services/api"
import { useHouseholdStore } from "../../../store/householdStore"
import { useFinancialChat } from "../hooks/useFinancialChat"

const suggestions = [
  "¿Qué gastos fijos tengo pendientes?",
  "¿Qué vence esta semana?",
  "¿Cuánto me queda por pagar este mes?",
  "¿Cuánto gastamos el mes pasado?",
  "¿Gastamos más que el mes anterior?",
  "¿Cómo evolucionó comida en 3 meses?",
]

export function AiConversationScreen({ route }: any) {
  const householdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const [conversationId, setConversationId] = useState<string | null>(
    route.params?.conversationId ?? null
  )
  const [input, setInput] = useState("")
  const { messages, sendMessage, isPending, error, isLoadingMessages } =
    useFinancialChat(conversationId, setConversationId)
  const errorMessage =
    error instanceof ApiError && error.code === "AI_DAILY_LIMIT_REACHED"
      ? "Estás haciendo demasiadas preguntas. Intenta nuevamente en un momento."
      : "No se pudo obtener una respuesta. Inténtalo de nuevo."

  useEffect(() => {
    setConversationId(route.params?.conversationId ?? null)
  }, [route.params?.conversationId])

  function handleSend() {
    if (sendMessage(input)) {
      setInput("")
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {!conversationId && !messages.length ? (
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
        ) : null}

        {isLoadingMessages && conversationId ? <ActivityIndicator /> : null}

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.message,
              message.role === "user" ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <Text style={styles.messageRole}>{message.role === "user" ? "Tú" : "IA"}</Text>
            <Text style={message.role === "user" ? styles.userMessageContent : styles.messageContent}>
              {message.content}
            </Text>
          </View>
        ))}

        {isPending ? (
          <View style={styles.thinking}>
            <ActivityIndicator size="small" />
            <Text>Pensando...</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{errorMessage}</Text> : null}
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
          style={[styles.sendButton, (!input.trim() || isPending || !householdId) && styles.disabled]}
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
  messages: { flex: 1 },
  messagesContent: { padding: 20, gap: 12 },
  emptyState: { gap: 16 },
  subtitle: { color: "#777", lineHeight: 21 },
  suggestions: { gap: 10 },
  suggestion: { borderColor: "#ddd", borderRadius: 12, borderWidth: 1, padding: 13 },
  suggestionText: { fontWeight: "600" },
  message: { borderRadius: 14, gap: 4, maxWidth: "88%", padding: 13 },
  userMessage: { alignSelf: "flex-end", backgroundColor: "#111" },
  assistantMessage: { alignSelf: "flex-start", backgroundColor: "#f1f1f1" },
  messageRole: { color: "#777", fontSize: 12, fontWeight: "700" },
  messageContent: { lineHeight: 21 },
  userMessageContent: { color: "#fff", lineHeight: 21 },
  thinking: { alignItems: "center", flexDirection: "row", gap: 8 },
  error: { color: "#b42318" },
  inputRow: { alignItems: "flex-end", borderTopColor: "#eee", borderTopWidth: 1, flexDirection: "row", gap: 8, padding: 12 },
  input: { borderColor: "#ddd", borderRadius: 12, borderWidth: 1, flex: 1, maxHeight: 100, paddingHorizontal: 12, paddingVertical: 10 },
  sendButton: { backgroundColor: "#111", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  disabled: { opacity: 0.4 },
  sendText: { color: "#fff", fontWeight: "700" },
})
