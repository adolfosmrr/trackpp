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
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg"

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
  const insets = useSafeAreaInsets()
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

      <View style={[styles.composerWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.composer}>
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
            <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient
                  id="ai-send-button-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <Stop offset="0" stopColor="#BFFFC7" />
                  <Stop offset="1" stopColor="#18A5A7" />
                </LinearGradient>
              </Defs>
              <Rect
                width="100%"
                height="100%"
                fill="url(#ai-send-button-gradient)"
              />
            </Svg>
            <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
              <Path
                d="M8.36399 14.9999L6.36399 14.9999L6.36399 3.41394L1.70677 8.07117C1.31622 8.46139 0.683131 8.46159 0.292705 8.07117C-0.0977202 7.68074 -0.0975223 7.04765 0.292705 6.6571L6.65696 0.292846C7.04749 -0.0976787 7.6805 -0.0976787 8.07103 0.292846L14.4353 6.6571C14.8255 7.04765 14.8257 7.68074 14.4353 8.07117C14.0449 8.46159 13.4118 8.46139 13.0212 8.07117L8.36399 3.41394L8.36399 14.9999Z"
                fill="black"
              />
            </Svg>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  messages: { flex: 1 },
  messagesContent: { gap: 12, padding: 20, paddingTop: 80 },
  emptyState: { gap: 16 },
  subtitle: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 20,
    lineHeight: 20,
  },
  suggestions: { gap: 10 },
  suggestion: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  suggestionText: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
  },
  message: { borderRadius: 14, gap: 4, maxWidth: "88%", padding: 13 },
  userMessage: { alignSelf: "flex-end", backgroundColor: "#111" },
  assistantMessage: { alignSelf: "flex-start", backgroundColor: "#f1f1f1" },
  messageRole: { color: "#777", fontSize: 12, fontWeight: "700" },
  messageContent: { lineHeight: 21 },
  userMessageContent: { color: "#fff", lineHeight: 21 },
  thinking: { alignItems: "center", flexDirection: "row", gap: 8 },
  error: { color: "#b42318" },
  composerWrapper: {
    paddingHorizontal: 20,
    width: "100%",
  },
  composer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    flexDirection: "row",
    gap: 12,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    width: "100%",
  },
  input: {
    backgroundColor: "transparent",
    color: "#1C1C1C",
    flex: 1,
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 16,
    maxHeight: 100,
    padding: 0,
  },
  sendButton: {
    alignItems: "center",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    overflow: "hidden",
    width: 42,
  },
  disabled: { opacity: 0.4 },
})
