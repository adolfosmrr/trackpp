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
    return <ActivityIndicator />
  }

  if (!period?.lastPayment) {
    return (
      <View style={styles.center}>
        <Text>No se encontró el último pago para corregir.</Text>
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
      <Text>Último pago: {formatCurrency(lastPayment.amount, currency)}</Text>

      <TextInput
        style={styles.input}
        placeholder="Nuevo monto"
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
  container: { flex: 1, padding: 24, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700" },
  name: { fontSize: 18, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 14 },
  button: { padding: 16, borderRadius: 10, backgroundColor: "#111", alignItems: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
})
