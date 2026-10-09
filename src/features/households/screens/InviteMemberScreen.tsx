import { useState } from "react"

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts, radii } from "../../../theme"

import { BackLink } from "../../../components/navigation/BackLink"

import { useCreateInvitation } from "../hooks/useCreateInvitation"

export function InviteMemberScreen({
  navigation,
}: any) {
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
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <BackLink onPress={() => navigation.goBack()} />
      <Text style={styles.title}>
        Invitar pareja
      </Text>

      <Text style={styles.description}>
        Ingresa el correo de la persona
        que quieres agregar al espacio
        compartido.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="correo@ejemplo.com"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <Pressable
        style={[
          styles.button,
          invitationMutation.isPending &&
            styles.buttonDisabled,
        ]}
        onPress={handleInvite}
        disabled={
          invitationMutation.isPending
        }
      >
        <Text style={styles.buttonText}>
          {invitationMutation.isPending
            ? "Enviando..."
            : "Crear invitación"}
        </Text>
      </Pressable>
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
      padding: 24,
      gap: 18,
    },

    title: {
      fontSize: 26,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: fonts.sansSemibold,
    },

    description: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: fonts.sans,
      lineHeight: 22,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radii.sm,
      backgroundColor: colors.field,
      color: colors.foreground,
      fontFamily: fonts.sans,
      padding: 12,
    },

    button: {
      backgroundColor: colors.brand,
      padding: 12,
      borderRadius: radii.sm,
      alignItems: "center",
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color: colors.brandForeground,
      fontFamily: fonts.sansSemibold,
      fontWeight: "600",
    },
  })