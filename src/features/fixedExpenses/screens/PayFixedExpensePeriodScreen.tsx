import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts } from "../../../theme"

import { Button } from "../../../components/buttons/Button"
import { TextField } from "../../../components/inputs/TextField"
import { BackLink } from "../../../components/navigation/BackLink"
import { useFormatMoney } from "../../households/hooks/useFormatMoney"

import { useFixedExpensePeriods } from "../hooks/useFixedExpensePeriods"
import { usePayFixedExpensePeriod } from "../hooks/usePayFixedExpensePeriod"
import type { AppStackParamList } from "../../../navigation/types"

type PayFixedExpensePeriodScreenProps = NativeStackScreenProps<
  AppStackParamList,
  "PayFixedExpensePeriod"
>

export function PayFixedExpensePeriodScreen({
  route,
  navigation,
}: PayFixedExpensePeriodScreenProps) {
  const insets = useSafeAreaInsets()
  const format = useFormatMoney()
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
        `El monto supera el saldo pendiente de ${format(currentPeriod.remaining)}.`
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
      <Text style={styles.meta}>Total: {format(period.expectedAmount)}</Text>
      <Text style={styles.meta}>Pagado: {format(period.totalPaid)}</Text>
      <Text style={styles.meta}>Pendiente: {format(period.remaining)}</Text>

      <TextField
        placeholder="Monto a pagar"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Button
        label="Pagar saldo completo"
        onPress={() => setAmount(String(period.remaining))}
        tone="outline"
      />
      <Button
        disabled={mutation.isPending}
        label={mutation.isPending ? "Registrando..." : "Registrar pago parcial"}
        onPress={() => void handlePay()}
        tone="brand"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: colors.foreground, fontFamily: fonts.sansSemibold, fontSize: 22, fontWeight: "600" },
  meta: { color: colors.mutedForeground, fontFamily: fonts.mono, fontSize: 14 },
})
