import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { GridBackground } from "../../../components/layout/GridBackground"
import { MeshGradient } from "../../../components/visual/MeshGradient"
import { useAiConversationPreviews } from "../hooks/useAiConversationPreviews"
import { useAiConversations } from "../hooks/useAiConversations"
import { useDeleteAiConversation } from "../hooks/useDeleteAiConversation"
import type { AiConversation } from "../types"

export function AiChatScreen({ navigation }: any) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null)
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

  function confirmDelete(conversationId: string) {
    Alert.alert(
      "¿Eliminar conversación?",
      "Esta conversación y sus mensajes se eliminarán permanentemente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void handleDelete(conversationId),
        },
      ]
    )
  }

  async function handleDelete(conversationId: string) {
    if (deletingConversationId === conversationId) return

    setDeletingConversationId(conversationId)
    try {
      await deleteMutation.mutateAsync(conversationId)
    } catch {
      Alert.alert("Error", "No se pudo eliminar la conversación.")
    } finally {
      setDeletingConversationId(null)
    }
  }

  return (
    <ScreenContainer style={styles.container}>
      <MeshGradient
        colors={["#FFF", "#4F3B97", "#14044B", "#FFF"]}
        speed={0.5}
        blur={0.5}
        noise={0.3}
        intensity={1}
        animated
        style={styles.meshBackground}
      />
      <GridBackground />
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
            tintColor="#1C1C1C"
            colors={["#1C1C1C"]}
            progressBackgroundColor="#FFFFFF"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.conversationGap} />}
        ListHeaderComponent={(
          <View>
            <Text style={styles.title}>AIsistente</Text>
            <Pressable style={styles.newConversationButton} onPress={handleNewConversation}>
              <Text style={styles.newConversationText}>Nueva conversación</Text>
              <FieldChevronIcon />
            </Pressable>
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
            <Text style={styles.emptyText}>Aún no tienes conversaciones.</Text>
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
            isDeleting={deletingConversationId === item.id}
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
        >
          <Text style={styles.deleteText}>{isDeleting ? "Eliminando..." : "Eliminar"}</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

export function getConversationPreview(value: string) {
  const normalized = value.trim()

  if (normalized.length <= 20) {
    return normalized
  }

  return `${normalized.slice(0, 20)}...`
}

export function formatConversationDate(value: string) {
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
    backgroundColor: "#FFFFFF",
  },
  meshBackground: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  listContent: { flexGrow: 1 },
  listFooter: { height: 20 },
  title: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 40,
    lineHeight: 40,
  },
  newConversationButton: {
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: "100%",
  },
  newConversationText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 18,
    lineHeight: 18,
  },
  recentConversationsTitle: {
    color: "rgba(28,28,28,0.5)",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 40,
    lineHeight: 40,
    marginBottom: 20,
    marginTop: 40,
  },
  conversationGap: { height: 10 },
  conversationCard: {
    backgroundColor: "#000000",
    borderRadius: 20,
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
    color: "#FFFFFF",
    flex: 1,
    flexShrink: 1,
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 18,
    lineHeight: 18,
  },
  separator: {
    backgroundColor: "rgba(255,255,255,0.5)",
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
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Satoshi-Bold",
    fontSize: 14,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  deleteText: {
    color: "#FF2F2F",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 12,
    lineHeight: 12,
  },
  loadingText: { color: "rgba(28,28,28,0.5)", marginTop: 20 },
  errorText: { color: "#B42318", marginTop: 20 },
  emptyText: { color: "rgba(28,28,28,0.5)", marginTop: 20 },
})
