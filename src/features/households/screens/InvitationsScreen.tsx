import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, layout, radii } from "../../../theme"

import { Button } from "../../../components/buttons/Button"
import { BackLink } from "../../../components/navigation/BackLink"
import { AppText } from "../../../components/text/AppText"

import { useInvitations } from "../hooks/useInvitations"
import { useAcceptInvitation } from "../hooks/useAcceptInvitation"
import type { AppStackParamList } from "../../../navigation/types"

export function InvitationsScreen({
  navigation,
}: NativeStackScreenProps<AppStackParamList, "Invitations">) {
  const insets = useSafeAreaInsets()
  const {
    data: invitations,
    isLoading,
    error,
  } = useInvitations()

  const acceptMutation = useAcceptInvitation()

  async function handleAccept(invitationId: string) {
    try {
      await acceptMutation.mutateAsync(invitationId)

      Alert.alert(
        "Invitación aceptada",
        "Ya formas parte del espacio compartido.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      )
    } catch (acceptError) {
      const message = acceptError instanceof Error
        ? parseApiError(acceptError.message)
        : "No se pudo aceptar la invitación."

      Alert.alert("Error", message)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.padded, { paddingTop: insets.top + layout.titleContentGap }]}>
        <BackLink onPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.container, styles.padded, { paddingTop: insets.top + layout.titleContentGap }]}>
        <BackLink onPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <AppText style={styles.centerText} tone="muted" variant="body">
            No se pudieron cargar las invitaciones.
          </AppText>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + layout.titleContentGap },
      ]}
    >
      <BackLink onPress={() => navigation.goBack()} />
      <AppText variant="title">Invitaciones</AppText>

      {!invitations?.length ? (
        <AppText style={styles.centerText} tone="muted" variant="body">
          No tienes invitaciones pendientes.
        </AppText>
      ) : (
        invitations.map((invitation) => (
          <View key={invitation.id} style={styles.card}>
            <AppText variant="subtitle">{invitation.household.name}</AppText>
            <AppText tone="muted" variant="body">
              Te invitaron a unirte a este espacio financiero.
            </AppText>
            <Button
              disabled={acceptMutation.isPending}
              label={acceptMutation.isPending ? "Aceptando..." : "Aceptar invitación"}
              onPress={() => handleAccept(invitation.id)}
              tone="brand"
            />
          </View>
        ))
      )}
    </ScrollView>
  )
}

function parseApiError(message: string) {
  try {
    const parsed = JSON.parse(message)

    if (typeof parsed.error === "string") {
      return parsed.error
    }
  } catch {}

  return message
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: layout.sheetPadding,
  },
  content: {
    padding: layout.sheetPadding,
    gap: layout.titleContentGap,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    textAlign: "center",
  },
  card: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    gap: 12,
  },
})
