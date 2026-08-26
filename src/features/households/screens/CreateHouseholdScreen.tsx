import { useState } from "react"

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native"

import {
  useCreateHousehold,
} from "../hooks/useCreateHousehold"

export function CreateHouseholdScreen({
  navigation,
}: any) {
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
    <View style={styles.container}>
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
      padding: 24,
      gap: 18,
    },

    title: {
      fontSize: 26,
      fontWeight: "700",
    },

    description: {
      fontSize: 15,
      color: "#777",
      lineHeight: 22,
    },

    input: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 12,
      padding: 14,
    },

    button: {
      backgroundColor: "#111",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color: "#fff",
      fontWeight: "700",
    },
  })
