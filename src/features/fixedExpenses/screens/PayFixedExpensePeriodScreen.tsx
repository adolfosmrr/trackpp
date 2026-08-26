import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { useFixedExpensePeriods } from "../hooks/useFixedExpensePeriods"
import { usePayFixedExpensePeriod } from "../hooks/usePayFixedExpensePeriod"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"

export function PayFixedExpensePeriodScreen({ route, navigation }: any) {
  const periodsQuery = useFixedExpensePeriods()
  const { data: periods, isLoading } = periodsQuery
  const mutation = usePayFixedExpensePeriod()
  const { data: memberships } = useHouseholds()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const currency = memberships?.find(
    (membership) => membership.household.id === selectedHouseholdId
  )?.household.currency ?? "ARS"
  const period = periods?.find((item) => item.id === route.params.periodId)
  const [amount, setAmount] = useState("")

  if (isLoading) {
    return <ActivityIndicator />
  }

  if (!period) {
    return <View style={styles.center}><Text>No se encontró la obligación mensual.</Text></View>
  }

  const currentPeriod = period

  async function handlePay() {
    const parsedAmount = Number(amount.replace(",", "."))

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Escribe un monto válido.")
      return
    }

    if (parsedAmount > currentPeriod.remaining) {
      Alert.alert(
        "Error",
        `El monto supera el saldo pendiente de ${formatCurrency(currentPeriod.remaining, currency)}.`
      )
      return
    }

    try {
      await mutation.mutateAsync({ periodId: currentPeriod.id, amount: parsedAmount })
      navigation.goBack()
    } catch (error) {
      await periodsQuery.refetch()
      Alert.alert(
        "No se pudo registrar el pago",
        error instanceof Error && /saldo|pagado|exceed|remaining/i.test(error.message)
          ? "Este gasto ya fue pagado o el saldo pendiente cambió."
          : "No se pudo registrar el pago. Intenta nuevamente."
      )
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{period.name}</Text>
      <Text>Total: {formatCurrency(period.expectedAmount, currency)}</Text>
      <Text>Pagado: {formatCurrency(period.totalPaid, currency)}</Text>
      <Text>Pendiente: {formatCurrency(period.remaining, currency)}</Text>

      <TextInput
        style={styles.input}
        placeholder="Monto a pagar"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Pressable style={styles.secondaryButton} onPress={() => setAmount(String(period.remaining))}>
        <Text style={styles.secondaryButtonText}>Pagar saldo completo</Text>
      </Pressable>
      <Pressable style={[styles.button, mutation.isPending && styles.disabled]} onPress={() => void handlePay()} disabled={mutation.isPending}>
        <Text style={styles.buttonText}>{mutation.isPending ? "Registrando..." : "Registrar pago parcial"}</Text>
      </Pressable>
    </View>
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 14 },
  secondaryButton: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#111", alignItems: "center" },
  secondaryButtonText: { fontWeight: "600" },
  button: { padding: 16, borderRadius: 10, backgroundColor: "#111", alignItems: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
})
