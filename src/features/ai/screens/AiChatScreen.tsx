import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { GlassButton, liquidGlassEnabled } from "../../../components/buttons/GlassButton"
import { EmptyState } from "../../../components/feedback/EmptyState"
import { showUndo } from "../../../components/feedback/undo"
import { useHouseholdStore } from "../../../store/householdStore"
import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { GradientBackground } from "../../../components/visual/GradientBackground"
import { useAiConversationPreviews } from "../hooks/useAiConversationPreviews"
import { useAiConversations } from "../hooks/useAiConversations"
import { useDeleteAiConversation } from "../hooks/useDeleteAiConversation"
import type { AiConversation } from "../types"
import { colors, fonts, radii, refreshControlColors } from "../../../theme"

type AiChatScreenProps = {
  navigation: {
    navigate(
      screen: "AiConversation",
      params?: { conversationId?: string },
    ): void
  }
}

export function AiChatScreen({ navigation }: AiChatScreenProps) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const [refreshing, setRefreshing] = useState(false)
  const conversationsQuery = useAiConversations()
  const deleteMutation = useDeleteAiConversation()
  const listTopPadding = Math.max(100, insets.top + 20)
  const conversations = [...(conversationsQuery.data ?? [])].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  )
  const { previews } = useAiConversationPreviews(conversations)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await conversationsQuery.refetch()
      await queryClient.refetchQueries({ queryKey: ["ai-messages"], type: "active" })
    } finally {
      setRefreshing(false)
    }
  }

  function handleNewConversation() {
    navigation.navigate("AiConversation")
  }

  async function confirmDelete(conversationId: string) {
    const queryKey = ["ai-conversations", selectedHouseholdId] as const
    const previous = queryClient.getQueryData<AiConversation[]>(queryKey)
    queryClient.setQueryData<AiConversation[]>(
      queryKey,
      (current) => current?.filter((conversation) => conversation.id !== conversationId),
    )

    try {
      await deleteMutation.mutateAsync(conversationId)
    } catch {
      queryClient.setQueryData(queryKey, previous)
      showUndo({ message: "No se pudo eliminar la conversación." })
      return
    }

    showUndo({ message: "Eliminaste la conversación" })
  }

  return (
    <ScreenContainer style={styles.container}>
      <GradientBackground dotSpacing={15} token="topSection" />
      <FlatList
        data={conversations}
        keyExtractor={(conversation) => conversation.id}
        alwaysBounceVertical
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: listTopPadding },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            progressViewOffset={listTopPadding}
            {...refreshControlColors}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.conversationGap} />}
        ListHeaderComponent={(
          <View>
            <Text style={styles.title}>AIsistente</Text>
            <GlassButton
              accessibilityLabel="Nueva conversación"
              fallbackStyle={styles.newConversationButton}
              glassStyle={styles.newConversationGlass}
              onPress={handleNewConversation}
              style={styles.newConversationContent}
            >
              <Text
                style={[
                  styles.newConversationText,
                  liquidGlassEnabled && styles.newConversationTextOnGlass,
                ]}
              >
                Nueva conversación
              </Text>
              <FieldChevronIcon
                color={liquidGlassEnabled ? colors.foreground : colors.brandForeground}
              />
            </GlassButton>
            <Text style={styles.recentConversationsTitle}>
              Conversaciones{"\n"}recientes
            </Text>
          </View>
        )}
        ListEmptyComponent={
          conversationsQuery.isLoading ? (
            <Text style={styles.loadingText}>Cargando conversaciones...</Text>
          ) : conversationsQuery.error ? (
            <Text style={styles.errorText}>No se pudieron cargar las conversaciones.</Text>
          ) : (
            <EmptyState
              title="Todavía no hablaste con el asistente"
              body="Preguntale por tus gastos o por cómo viene el mes."
              actionLabel="Nueva conversación"
              onAction={handleNewConversation}
            />
          )
        }
        ListFooterComponent={<View style={styles.listFooter} />}
        renderItem={({ item, index }) => (
          <ConversationCard
            conversation={item}
            preview={previews[index] ?? item.title ?? "Sin título"}
            onPress={() => navigation.navigate("AiConversation", {
              conversationId: item.id,
            })}
            onDelete={() => confirmDelete(item.id)}
            isDeleting={false}
          />
        )}
      />
    </ScreenContainer>
  )
}

function ConversationCard({
  conversation,
  preview,
  onPress,
  onDelete,
  isDeleting,
}: {
  conversation: AiConversation
  preview: string
  onPress: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <Pressable style={styles.conversationCard} onPress={onPress}>
      <View style={styles.conversationHeader}>
        <Text style={styles.preview} numberOfLines={1}>
          {getConversationPreview(preview)}
        </Text>
        <FieldChevronIcon />
      </View>

      <View style={styles.separator} />

      <View style={styles.conversationFooter}>
        <Text style={styles.date}>{formatConversationDate(conversation.updatedAt)}</Text>
        <Pressable
          onPress={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          hitSlop={8}
          style={styles.deleteHit}
        >
          <Text style={styles.deleteText}>{isDeleting ? "Eliminando..." : "Eliminar"}</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

function getConversationPreview(value: string) {
  const normalized = value.trim()

  if (normalized.length <= 20) {
    return normalized
  }

  return `${normalized.slice(0, 20)}...`
}

function formatConversationDate(value: string) {
  const date = new Date(value)
  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    timeZone: "UTC",
  }).format(date).replaceAll(".", "").toUpperCase()
  const month = new Intl.DateTimeFormat("es-ES", {
    month: "short",
    timeZone: "UTC",
  }).format(date).replaceAll(".", "").toUpperCase().replace("SEPT", "SEP")
  const day = String(date.getUTCDate()).padStart(2, "0")

  return `${weekday} ${day} ${month} ${date.getUTCFullYear()}`
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  listContent: { flexGrow: 1 },
  listFooter: { height: 20 },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 28,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  newConversationButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: "100%",
  },
  newConversationGlass: {
    borderRadius: radii.sm,
    marginTop: 20,
    width: "100%",
  },
  newConversationContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: "100%",
  },
  newConversationText: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 18,
    lineHeight: 18,
  },
  newConversationTextOnGlass: {
    color: colors.foreground,
  },
  recentConversationsTitle: {
    color: colors.mutedForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 26,
    marginBottom: 20,
    marginTop: 40,
  },
  conversationGap: { height: 10 },
  conversationCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: "100%",
  },
  conversationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  preview: {
    color: colors.foreground,
    flex: 1,
    flexShrink: 1,
    fontFamily: fonts.sans,
    fontSize: 18,
    lineHeight: 18,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 15,
    width: "100%",
  },
  conversationFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  date: {
    color: colors.mutedForeground,
    fontFamily: fonts.mono,
    fontSize: 14,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  deleteHit: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  deleteText: {
    color: colors.destructive,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 12,
  },
  loadingText: { color: colors.mutedForeground, fontFamily: fonts.sans, marginTop: 20 },
  errorText: { color: colors.destructive, fontFamily: fonts.sans, marginTop: 20 },
})
