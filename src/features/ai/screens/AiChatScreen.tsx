import { useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CompositeScreenProps, useIsFocused } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { NativeBottomTabScreenProps } from "@react-navigation/bottom-tabs/unstable"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect"

import { GlassButton } from "../../../components/buttons/GlassButton"
import { EmptyState } from "../../../components/feedback/EmptyState"
import { AppText } from "../../../components/text/AppText"
import { showUndo } from "../../../components/feedback/undo"
import { useHouseholdStore } from "../../../store/householdStore"
import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { GradientBackground } from "../../../components/visual/GradientBackground"
import { useAiConversationPreviews } from "../hooks/useAiConversationPreviews"
import { useAiConversations } from "../hooks/useAiConversations"
import { useDeleteAiConversation } from "../hooks/useDeleteAiConversation"
import type { AiConversation } from "../types"
import { colors, fonts, layout, radii, refreshControlColors } from "../../../theme"
import type { AppStackParamList, MainTabsParamList } from "../../../navigation/types"

const liquidGlassEnabled = isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

type AiChatScreenProps = CompositeScreenProps<
  NativeBottomTabScreenProps<MainTabsParamList, "AiChat">,
  NativeStackScreenProps<AppStackParamList>
>

export function AiChatScreen({ navigation }: AiChatScreenProps) {
  const insets = useSafeAreaInsets()
  const isFocused = useIsFocused()
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
    navigation.navigate("AiConversation", {})
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
      <GradientBackground dotMotion={isFocused} dotSpacing={15} token="topSection" />
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
            <AppText variant="title">AIsistente</AppText>
            <GlassButton
              accessibilityLabel="Nueva conversación"
              fallbackStyle={styles.newConversationButton}
              glassStyle={styles.newConversationGlass}
              icon={(color) => <FieldChevronIcon color={color} />}
              label="Nueva conversación"
              onPress={handleNewConversation}
              style={styles.newConversationContent}
              tone="brand"
            />
            <AppText style={styles.recentConversationsTitle} tone="muted" variant="title">
              Conversaciones{"\n"}recientes
            </AppText>
          </View>
        )}
        ListEmptyComponent={
          conversationsQuery.isLoading ? (
            <AppText tone="muted" variant="body">Cargando conversaciones...</AppText>
          ) : conversationsQuery.error ? (
            <AppText tone="destructive" variant="body">No se pudieron cargar las conversaciones.</AppText>
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
  const body = (
    <>
      <View style={styles.conversationHeader}>
        <AppText numberOfLines={1} style={styles.preview} variant="subtitle">
          {getConversationPreview(preview)}
        </AppText>
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
          <AppText tone="destructive" variant="caption">{isDeleting ? "Eliminando..." : "Eliminar"}</AppText>
        </Pressable>
      </View>
    </>
  )

  return (
    <ConversationSurface>
      <Pressable style={styles.conversationCard} onPress={onPress}>
        {body}
      </Pressable>
    </ConversationSurface>
  )
}

function ConversationSurface({ children }: { children: ReactNode }) {
  if (!liquidGlassEnabled) {
    return <View style={styles.conversationFallback}>{children}</View>
  }

  return (
    <GlassView colorScheme="dark" glassEffectStyle="regular" style={styles.conversationGlass}>
      {children}
    </GlassView>
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
  newConversationButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    flexDirection: "row",
    height: layout.headerPill,
    justifyContent: "space-between",
    marginTop: layout.titleContentGap,
    paddingHorizontal: layout.sheetPadding,
    width: "100%",
  },
  newConversationGlass: {
    marginTop: layout.titleContentGap,
    width: "100%",
  },
  newConversationContent: {
    alignItems: "center",
    flexDirection: "row",
    height: layout.headerPill,
    justifyContent: "space-between",
    paddingHorizontal: layout.sheetPadding,
    width: "100%",
  },
  recentConversationsTitle: {
    marginBottom: layout.titleContentGap,
    marginTop: layout.titleContentGap,
  },
  conversationGap: { height: 10 },
  conversationGlass: {
    borderRadius: radii.topSection,
    overflow: "hidden",
    width: "100%",
  },
  conversationFallback: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.topSection,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  conversationCard: {
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
    flex: 1,
    flexShrink: 1,
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
})
