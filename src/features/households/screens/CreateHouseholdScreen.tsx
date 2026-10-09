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

import {
  useCreateHousehold,
} from "../hooks/useCreateHousehold"

export function CreateHouseholdScreen({
  navigation,
}: any) {
  const insets = useSafeAreaInsets()
  const [name, setName] =
    useState("")

  const createHouseholdMutation =
    useCreateHousehold()

  async function handleCreate() {
    const cleanName =
      name.trim()

    if (!cleanName) {
      Alert.alert(
        "Error",
        "Escribe un nombre para el espacio."
      )
      return
    }

    try {
      await createHouseholdMutation.mutateAsync(
        cleanName
      )

      navigation.goBack()
    } catch (error) {
      console.error("Create household error:", error)

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear el espacio."

      Alert.alert(
        "Error",
        message
      )
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <BackLink onPress={() => navigation.goBack()} />
      <Text style={styles.title}>
        Crear espacio compartido
      </Text>

      <Text style={styles.description}>
        Usa este espacio para compartir
        gastos, presupuestos e ingresos
        con tu pareja.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ej. Casa"
        placeholderTextColor={colors.mutedForeground}
        value={name}
        onChangeText={setName}
      />

      <Pressable
        style={[
          styles.button,
          createHouseholdMutation.isPending &&
            styles.buttonDisabled,
        ]}
        onPress={handleCreate}
        disabled={
          createHouseholdMutation.isPending
        }
      >
        <Text
          style={styles.buttonText}
        >
          {createHouseholdMutation.isPending
            ? "Creando..."
            : "Crear espacio"}
        </Text>
      </Pressable>
    </View>
  )
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
