import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { ApiError } from "../../../services/api"
import type { AppStackParamList } from "../../../navigation/types"
import { useHouseholdStore } from "../../../store/householdStore"
import { GradientBackground } from "../../../components/visual/GradientBackground"
import { THINKING_PLACEHOLDER, useFinancialChat } from "../hooks/useFinancialChat"
import { useReduceMotion, useTypewriter } from "../hooks/useTypewriter"
import type { AiMessage } from "../types"
import { BackLink } from "../../../components/navigation/BackLink"
import { colors, fonts, layout, radii } from "../../../theme"

const FIELD_FADE_MS = 400

const suggestions = [
  "¿Qué gastos fijos tengo pendientes?",
  "¿Qué vence esta semana?",
  "¿Cuánto me queda por pagar este mes?",
  "¿Cuánto gastamos el mes pasado?",
  "¿Gastamos más que el mes anterior?",
  "¿Cómo evolucionó comida en 3 meses?",
]

type AiConversationScreenProps = NativeStackScreenProps<AppStackParamList, "AiConversation">

function ThinkingLabel() {
  const reduceMotion = useReduceMotion()
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(opacity)
      opacity.value = 1
      return
    }

    opacity.value = withRepeat(
      withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )

    return () => cancelAnimation(opacity)
  }, [opacity, reduceMotion])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.Text style={[styles.messageContent, animatedStyle]}>
      {THINKING_PLACEHOLDER}
    </Animated.Text>
  )
}

function ThinkingBackdrop({ active }: { active: boolean }) {
  const opacity = useSharedValue(0)
  const [mounted, setMounted] = useState(false)
  const activeRef = useRef(active)
  activeRef.current = active
  const hide = useCallback(() => {
    if (!activeRef.current) setMounted(false)
  }, [])

  useEffect(() => {
    if (active) setMounted(true)
  }, [active])

  useLayoutEffect(() => {
    if (!mounted) return

    if (active) {
      opacity.value = withTiming(1, { duration: FIELD_FADE_MS })
      return
    }

    opacity.value = withTiming(0, { duration: FIELD_FADE_MS }, (finished) => {
      if (finished) scheduleOnRN(hide)
    })
  }, [active, hide, mounted, opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  if (!mounted) return null

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      <GradientBackground dotMotion dotSpacing={15} token="topSection" />
    </Animated.View>
  )
}

function MessageBubble({
  message,
  reveal,
  onRevealComplete,
}: {
  message: AiMessage
  reveal: boolean
  onRevealComplete: () => void
}) {
  const content = useTypewriter(message.content, reveal && !message.pending, onRevealComplete)
  const isUser = message.role === "user"

  return (
    <View style={[styles.message, isUser ? styles.userMessage : styles.assistantMessage]}>
      <Text style={styles.messageRole}>{isUser ? "Tú" : "IA"}</Text>
      {message.pending ? (
        <ThinkingLabel />
      ) : (
        <Text style={isUser ? styles.userMessageContent : styles.messageContent}>{content}</Text>
      )}
    </View>
  )
}

export function AiConversationScreen({ route, navigation }: AiConversationScreenProps) {
  const insets = useSafeAreaInsets()
  const householdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const [conversationId, setConversationId] = useState<string | null>(
    route.params?.conversationId ?? null
  )
  const [input, setInput] = useState("")
  const messagesRef = useRef<ScrollView>(null)
  const { messages, sendMessage, retry, revealMessageId, completeReveal, isPending, error, isLoadingMessages } =
    useFinancialChat(conversationId, setConversationId)
  const errorMessage =
    error instanceof ApiError && error.code === "AI_DAILY_LIMIT_REACHED"
      ? "Estás haciendo demasiadas preguntas. Intenta nuevamente en un momento."
      : "No se pudo obtener una respuesta. Inténtalo de nuevo."

  useEffect(() => {
    setConversationId(route.params?.conversationId ?? null)
  }, [route.params?.conversationId])

  function handleSend(text?: string) {
    const message = text ?? input
    if (isPending || !householdId || !message.trim()) return
    setInput("")
    sendMessage(message)
  }

  return (
    <View style={styles.screen}>
      <ThinkingBackdrop active={isPending} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <BackLink onPress={() => navigation.goBack()} />
        </View>
        <ScrollView
          ref={messagesRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => messagesRef.current?.scrollToEnd({ animated: false })}
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
                    onPress={() => handleSend(suggestion)}
                    disabled={isPending || !householdId}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {isLoadingMessages && conversationId ? <ActivityIndicator color={colors.brand} /> : null}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              reveal={message.id === revealMessageId}
              onRevealComplete={completeReveal}
            />
          ))}

          {!isPending && error ? (
            <View style={styles.errorRow}>
              <Text style={styles.error}>{errorMessage}</Text>
              <Pressable
                accessibilityLabel="Reintentar"
                accessibilityRole="button"
                disabled={isPending}
                onPress={retry}
                style={styles.retry}
              >
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.composerWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Pregunta algo sobre tus finanzas"
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={500}
              editable={Boolean(householdId)}
              onSubmitEditing={() => handleSend()}
            />
            <Pressable
              style={[styles.sendButton, (!input.trim() || isPending || !householdId) && styles.disabled]}
              onPress={() => handleSend()}
              disabled={!input.trim() || isPending || !householdId}
            >
              <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
                <Path
                  d="M8.36399 14.9999L6.36399 14.9999L6.36399 3.41394L1.70677 8.07117C1.31622 8.46139 0.683131 8.46159 0.292705 8.07117C-0.0977202 7.68074 -0.0975223 7.04765 0.292705 6.6571L6.65696 0.292846C7.04749 -0.0976787 7.6805 -0.0976787 8.07103 0.292846L14.4353 6.6571C14.8255 7.04765 14.8257 7.68074 14.4353 8.07117C14.0449 8.46159 13.4118 8.46139 13.0212 8.07117L8.36399 3.41394L8.36399 14.9999Z"
                  fill={colors.brandForeground}
                />
              </Svg>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  messages: { flex: 1 },
  header: { paddingHorizontal: layout.sectionInset, paddingBottom: 8 },
  messagesContent: { gap: 12, padding: layout.sectionInset, paddingTop: 12 },
  emptyState: { gap: 16 },
  subtitle: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 20,
    lineHeight: 20,
  },
  suggestions: { gap: 10 },
  suggestion: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 16,
  },
  message: { borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, gap: 4, maxWidth: "88%", padding: 12 },
  userMessage: { alignSelf: "flex-end", backgroundColor: colors.brandMuted, borderColor: colors.brandBorder },
  assistantMessage: { alignSelf: "flex-start", backgroundColor: colors.card },
  messageRole: { color: colors.mutedForeground, fontFamily: fonts.sansMedium, fontSize: 12, fontWeight: "600" },
  messageContent: { color: colors.foreground, fontFamily: fonts.sans, lineHeight: 21 },
  userMessageContent: { color: colors.foreground, fontFamily: fonts.sans, lineHeight: 21 },
  errorRow: { alignItems: "flex-start", gap: 8 },
  error: { color: colors.destructive, fontFamily: fonts.sans },
  retry: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
  },
  retryText: {
    color: colors.brand,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  composerWrapper: {
    paddingHorizontal: layout.sectionInset,
    width: "100%",
  },
  composer: {
    alignItems: "center",
    backgroundColor: colors.field,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    width: "100%",
  },
  input: {
    backgroundColor: "transparent",
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    maxHeight: 100,
    padding: 0,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    height: 42,
    justifyContent: "center",
    overflow: "hidden",
    width: 42,
  },
  disabled: { opacity: 0.4 },
})
