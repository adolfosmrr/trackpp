import { useEffect, useState } from "react"
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
import { useUpdateFixedExpensePayment } from "../hooks/useUpdateFixedExpensePayment"
import type { AppStackParamList } from "../../../navigation/types"

type CorrectFixedExpensePaymentScreenProps = NativeStackScreenProps<
  AppStackParamList,
  "CorrectFixedExpensePayment"
>

export function CorrectFixedExpensePaymentScreen({
  route,
  navigation,
}: CorrectFixedExpensePaymentScreenProps) {
  const insets = useSafeAreaInsets()
  const format = useFormatMoney()
  const periodsQuery = useFixedExpensePeriods()
  const { data: periods, isLoading } = periodsQuery
  const mutation = useUpdateFixedExpensePayment()
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
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <BackLink onPress={() => navigation.goBack()} />
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  if (!period?.lastPayment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <BackLink onPress={() => navigation.goBack()} />
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
        `El monto no puede superar ${format(maximumAmount)}.`
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
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <BackLink onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Corregir pago</Text>
      <Text style={styles.name}>{currentPeriod.name}</Text>
      <Text style={styles.meta}>Último pago: {format(lastPayment.amount)}</Text>

      <TextField
        placeholder="Nuevo monto"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        editable={!mutation.isPending}
      />

      <Button
        accessibilityLabel="Guardar corrección"
        disabled={mutation.isPending}
        label={mutation.isPending ? "Guardando..." : "Guardar corrección"}
        onPress={() => void handleSave()}
        tone="brand"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: colors.foreground, fontFamily: fonts.sansSemibold, fontSize: 22, fontWeight: "600" },
  name: { color: colors.foreground, fontFamily: fonts.sansMedium, fontSize: 18, fontWeight: "600" },
  meta: { color: colors.mutedForeground, fontFamily: fonts.mono, fontSize: 14 },
})
