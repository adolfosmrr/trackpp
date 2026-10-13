import { useEffect, useState } from "react"
import { Alert, StyleSheet, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Button } from "../../../components/buttons/Button"
import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { SegmentedToggle } from "../../../components/inputs/SegmentedToggle"
import { FieldRow, TextField } from "../../../components/inputs/TextField"
import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import type { AppStackParamList } from "../../../navigation/types"
import { useHouseholdStore } from "../../../store/householdStore"
import { layout } from "../../../theme"
import {
  currencyChoiceLabel,
  DEFAULT_SPACE_CURRENCY,
  type CurrencyOption,
} from "../data/currencies"
import { useCreateHousehold } from "../hooks/useCreateHousehold"
import { createHouseholdInvitation } from "../services/invitationService"
import type { HouseholdKind } from "../services/householdService"

type CreateHouseholdScreenProps = NativeStackScreenProps<AppStackParamList, "CreateHousehold">

export function CreateHouseholdScreen({ navigation, route }: CreateHouseholdScreenProps) {
  const setSelectedHouseholdId = useHouseholdStore((state) => state.setSelectedHouseholdId)
  const createHouseholdMutation = useCreateHousehold()
  const [kind, setKind] = useState<HouseholdKind>("personal")
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState<CurrencyOption>(DEFAULT_SPACE_CURRENCY)
  const [inviteEmail, setInviteEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const selection = route.params?.currencySelection
    if (!selection) return
    setCurrency({
      code: selection.code,
      country: selection.country,
      currency: selection.currencyName,
    })
    navigation.setParams({ currencySelection: undefined })
  }, [navigation, route.params?.currencySelection])

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
        currency: currency.code,
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
    <SheetScaffold onClose={() => navigation.goBack()} title="Crear Espacio">
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
        <FieldRow
          accessibilityLabel="Moneda del espacio"
          onPress={() => {
            navigation.navigate("CurrencyPicker", {
              selectedCode: currency.code,
              selectedCountry: currency.country,
            })
          }}
        >
          <AppText variant="subtitle">Moneda</AppText>
          <View style={styles.currencyValue}>
            <AppText numberOfLines={1} style={styles.currencyLabel} tone="muted" variant="subtitle">
              {currencyChoiceLabel(currency)}
            </AppText>
            <FieldChevronIcon />
          </View>
        </FieldRow>
        {kind === "couple" ? (
          <View style={styles.section}>
            <AppText variant="sectionTitle">Invitar ahora</AppText>
            <AppText tone="muted" variant="caption">
              Opcional. Si lo dejás vacío, podés invitar a otras personas más tarde desde Perfil.
            </AppText>
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
    </SheetScaffold>
  )
}

const styles = StyleSheet.create({
  fields: {
    gap: layout.titleContentGap,
  },
  section: {
    gap: layout.titleContentGap,
  },
  currencyValue: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: layout.titleContentGap,
    justifyContent: "flex-end",
    marginLeft: layout.titleContentGap,
  },
  currencyLabel: {
    flexShrink: 1,
    textAlign: "right",
  },
})
