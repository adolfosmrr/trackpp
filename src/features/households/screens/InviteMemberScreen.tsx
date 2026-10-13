import { useState } from "react"

import {
  View,
  StyleSheet,
  Alert,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, layout } from "../../../theme"

import { Button } from "../../../components/buttons/Button"
import { TextField } from "../../../components/inputs/TextField"
import { BackLink } from "../../../components/navigation/BackLink"
import { AppText } from "../../../components/text/AppText"

import { useCreateInvitation } from "../hooks/useCreateInvitation"
import type { AppStackParamList } from "../../../navigation/types"

export function InviteMemberScreen({
  navigation,
}: NativeStackScreenProps<AppStackParamList, "InviteMember">) {
  const insets = useSafeAreaInsets()
  const [email, setEmail] =
    useState("")

  const invitationMutation =
    useCreateInvitation()

  async function handleInvite() {
    const cleanEmail =
      email.trim().toLowerCase()

    if (!cleanEmail) {
      Alert.alert(
        "Error",
        "Escribe un correo electrónico."
      )
      return
    }

    try {
      await invitationMutation.mutateAsync(
        cleanEmail
      )

      Alert.alert(
        "Invitación creada",
        "La invitación quedó pendiente.",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.goBack(),
          },
        ]
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? parseApiError(error.message)
          : "No se pudo crear la invitación."

      Alert.alert("Error", message)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + layout.titleContentGap }]}>
      <BackLink onPress={() => navigation.goBack()} />
      <AppText variant="title">
        Invitar pareja
      </AppText>

      <AppText tone="muted" variant="body">
        Ingresa el correo de la persona
        que quieres agregar al espacio
        compartido.
      </AppText>

      <TextField
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <Button
        disabled={invitationMutation.isPending}
        label={invitationMutation.isPending ? "Enviando..." : "Crear invitación"}
        onPress={handleInvite}
        tone="brand"
      />
    </View>
  )
}

function parseApiError(
  message: string
) {
  try {
    const parsed =
      JSON.parse(message)

    if (
      typeof parsed.error ===
      "string"
    ) {
      return parsed.error
    }
  } catch {}

  return message
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: layout.sheetPadding,
      gap: layout.titleContentGap,
    },
  })