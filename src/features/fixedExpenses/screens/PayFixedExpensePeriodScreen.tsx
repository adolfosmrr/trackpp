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
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts, radii } from "../../../theme"

import { BackLink } from "../../../components/navigation/BackLink"
import { formatMoney } from "../../../utils/formatMoney"

import { useFixedExpensePeriods } from "../hooks/useFixedExpensePeriods"
import { usePayFixedExpensePeriod } from "../hooks/usePayFixedExpensePeriod"

export function PayFixedExpensePeriodScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets()
  const periodsQuery = useFixedExpensePeriods()
  const { data: periods, isLoading } = periodsQuery
  const mutation = usePayFixedExpensePeriod()
  const period = periods?.find((item) => item.id === route.params.periodId)
  const [amount, setAmount] = useState("")

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <BackLink onPress={() => navigation.goBack()} />
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  if (!period) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <BackLink onPress={() => navigation.goBack()} />
        <Text style={styles.meta}>No se encontró la obligación mensual.</Text>
      </View>
    )
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
        `El monto supera el saldo pendiente de ${formatMoney(currentPeriod.remaining)}.`
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
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <BackLink onPress={() => navigation.goBack()} />
      <Text style={styles.title}>{period.name}</Text>
      <Text style={styles.meta}>Total: {formatMoney(period.expectedAmount)}</Text>
      <Text style={styles.meta}>Pagado: {formatMoney(period.totalPaid)}</Text>
      <Text style={styles.meta}>Pendiente: {formatMoney(period.remaining)}</Text>

      <TextInput
        style={styles.input}
        placeholder="Monto a pagar"
        placeholderTextColor={colors.mutedForeground}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: colors.foreground, fontFamily: fonts.sansSemibold, fontSize: 22, fontWeight: "600" },
  meta: { color: colors.mutedForeground, fontFamily: fonts.mono, fontSize: 14 },
  input: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.sm, backgroundColor: colors.field, color: colors.foreground, fontFamily: fonts.sans, padding: 12 },
  secondaryButton: { alignItems: "center", borderColor: colors.borderStrong, borderRadius: radii.sm, borderWidth: 1, minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  secondaryButtonText: { color: colors.foreground, fontFamily: fonts.sansMedium, fontWeight: "600" },
  button: { alignItems: "center", backgroundColor: colors.brand, borderRadius: radii.sm, justifyContent: "center", minHeight: 44, paddingHorizontal: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.brandForeground, fontFamily: fonts.sansSemibold, fontWeight: "600" },
})
