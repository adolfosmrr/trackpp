import { useState } from "react"

import {
  View,
  Text,
  StyleSheet,
  Alert,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts } from "../../../theme"

import { Button } from "../../../components/buttons/Button"
import { TextField } from "../../../components/inputs/TextField"
import { BackLink } from "../../../components/navigation/BackLink"

import {
  useCreateHousehold,
} from "../hooks/useCreateHousehold"
import type { AppStackParamList } from "../../../navigation/types"

export function CreateHouseholdScreen({
  navigation,
}: NativeStackScreenProps<AppStackParamList, "CreateHousehold">) {
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

      <TextField
        placeholder="Ej. Casa"
        value={name}
        onChangeText={setName}
      />

      <Button
        disabled={createHouseholdMutation.isPending}
        label={createHouseholdMutation.isPending ? "Creando..." : "Crear espacio"}
        onPress={handleCreate}
        tone="brand"
      />
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

  })
