import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { colors, fonts, radii } from "../../../theme"

import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"
import { useFixedExpensePeriods } from "../hooks/useFixedExpensePeriods"
import { useUpdateFixedExpensePayment } from "../hooks/useUpdateFixedExpensePayment"

export function CorrectFixedExpensePaymentScreen({ route, navigation }: any) {
  const periodsQuery = useFixedExpensePeriods()
  const { data: periods, isLoading } = periodsQuery
  const mutation = useUpdateFixedExpensePayment()
  const { data: memberships } = useHouseholds()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const currency = memberships?.find(
    (membership) => membership.household.id === selectedHouseholdId
  )?.household.currency ?? "ARS"
  const period = periods?.find(
    (item) => item.lastPayment?.id === route.params.paymentId
  )
  const [amount, setAmount] = useState("")

  useEffect(() => {
    if (period?.lastPayment) {
      setAmount(String(period.lastPayment.amount))
    }
  }, [period?.lastPayment?.amount])

  if (isLoading) {
    return <ActivityIndicator color={colors.brand} />
  }

  if (!period?.lastPayment) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>No se encontró el último pago para corregir.</Text>
      </View>
    )
  }

  const currentPeriod = period
  const lastPayment = currentPeriod.lastPayment!

  async function handleSave() {
    const parsedAmount = Number(amount.replace(",", "."))
    const otherPayments = currentPeriod.totalPaid - lastPayment.amount
    const maximumAmount = currentPeriod.expectedAmount - otherPayments

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Escribe un monto válido mayor que cero.")
      return
    }

    if (parsedAmount > maximumAmount) {
      Alert.alert(
        "Error",
        `El monto no puede superar ${formatCurrency(maximumAmount, currency)}.`
      )
      return
    }

    try {
      await mutation.mutateAsync({
        paymentId: lastPayment.id,
        amount: parsedAmount,
      })
      navigation.goBack()
    } catch (error) {
      await periodsQuery.refetch()
      Alert.alert(
        "No se pudo corregir el pago",
        error instanceof Error && /latest|último|payment|pago/i.test(error.message)
          ? "El pago cambió desde otro dispositivo. Actualizamos la información."
          : "No se pudo corregir el pago. Intenta nuevamente."
      )
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Corregir pago</Text>
      <Text style={styles.name}>{currentPeriod.name}</Text>
      <Text style={styles.meta}>Último pago: {formatCurrency(lastPayment.amount, currency)}</Text>

      <TextInput
        style={styles.input}
        placeholder="Nuevo monto"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        editable={!mutation.isPending}
      />

      <Pressable
        accessibilityLabel="Guardar corrección"
        style={[styles.button, mutation.isPending && styles.disabled]}
        onPress={() => void handleSave()}
        disabled={mutation.isPending}
      >
        <Text style={styles.buttonText}>
          {mutation.isPending ? "Guardando..." : "Guardar corrección"}
        </Text>
      </Pressable>
    </View>
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: colors.foreground, fontFamily: fonts.sansSemibold, fontSize: 22, fontWeight: "600" },
  name: { color: colors.foreground, fontFamily: fonts.sansMedium, fontSize: 18, fontWeight: "600" },
  meta: { color: colors.mutedForeground, fontFamily: fonts.mono, fontSize: 14 },
  input: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.sm, backgroundColor: colors.field, color: colors.foreground, fontFamily: fonts.sans, padding: 12 },
  button: { padding: 12, borderRadius: radii.sm, backgroundColor: colors.brand, alignItems: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.brandForeground, fontFamily: fonts.sansSemibold, fontWeight: "600" },
})
