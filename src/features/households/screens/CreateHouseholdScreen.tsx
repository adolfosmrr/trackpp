import { useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "../../../components/buttons/Button"
import { SegmentedToggle } from "../../../components/inputs/SegmentedToggle"
import { TextField } from "../../../components/inputs/TextField"
import { OptionChips } from "../../fixedExpenses/components/OptionChips"
import type { AppStackParamList } from "../../../navigation/types"
import { useHouseholdStore } from "../../../store/householdStore"
import { colors, fonts, layout } from "../../../theme"
import { useCreateHousehold } from "../hooks/useCreateHousehold"
import { createHouseholdInvitation } from "../services/invitationService"
import type { HouseholdKind } from "../services/householdService"

const SPACE_CURRENCIES = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "BRL", label: "BRL" },
  { value: "UYU", label: "UYU" },
  { value: "CLP", label: "CLP" },
] as const

type SpaceCurrency = (typeof SPACE_CURRENCIES)[number]["value"]

type CreateHouseholdScreenProps = NativeStackScreenProps<AppStackParamList, "CreateHousehold">

export function CreateHouseholdScreen({ navigation }: CreateHouseholdScreenProps) {
  const insets = useSafeAreaInsets()
  const setSelectedHouseholdId = useHouseholdStore((state) => state.setSelectedHouseholdId)
  const createHouseholdMutation = useCreateHousehold()
  const [kind, setKind] = useState<HouseholdKind>("personal")
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState<SpaceCurrency>("ARS")
  const [inviteEmail, setInviteEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate() {
    const cleanName = name.trim()
    if (!cleanName) {
      Alert.alert("Error", "Escribí un nombre para el espacio.")
      return
    }

    const email = inviteEmail.trim().toLowerCase()
    setSubmitting(true)
    try {
      const household = await createHouseholdMutation.mutateAsync({
        name: cleanName,
        type: kind,
        currency,
      })
      setSelectedHouseholdId(household.id)

      if (kind === "couple" && email) {
        try {
          await createHouseholdInvitation(household.id, email)
        } catch (error) {
          const message = error instanceof Error
            ? error.message
            : "No se pudo enviar la invitación."
          Alert.alert(
            "Espacio creado",
            `${message} Podés invitar desde el perfil.`,
          )
          navigation.goBack()
          return
        }
      }

      navigation.goBack()
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "No se pudo crear el espacio."
      Alert.alert("Error", message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Crear Espacio</Text>
      <SegmentedToggle
        onChange={setKind}
        options={[
          { value: "personal", label: "Personal" },
          { value: "couple", label: "Compartido" },
        ]}
        value={kind}
        width="100%"
      />
      <View style={styles.fields}>
        <TextField
          onChangeText={setName}
          placeholder="Nombre del espacio"
          value={name}
        />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moneda</Text>
          <OptionChips
            accessibilityLabel="Moneda del espacio"
            onChange={setCurrency}
            options={SPACE_CURRENCIES}
            value={currency}
          />
        </View>
        {kind === "couple" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invitar ahora</Text>
            <Text style={styles.helper}>
              Opcional. Si lo dejás vacío, podés invitar más tarde.
            </Text>
            <TextField
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setInviteEmail}
              placeholder="correo@ejemplo.com"
              value={inviteEmail}
            />
          </View>
        ) : null}
        <Button
          disabled={submitting}
          label={submitting ? "Creando..." : "Crear espacio"}
          onPress={() => {
            void handleCreate()
          }}
          tone="brand"
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingHorizontal: layout.sectionInset,
    paddingTop: 8,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 20,
    fontWeight: "600",
  },
  fields: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 20,
  },
  helper: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
})
