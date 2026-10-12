import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "../../../components/buttons/Button"
import { BackLink } from "../../../components/navigation/BackLink"
import { colors, fonts, layout, radii } from "../../../theme"
import { formatMoney } from "../../../utils/formatMoney"
import type { AppStackParamList } from "../../../navigation/types"
import { OptionChips } from "../components/OptionChips"
import { useFixedExpenseHistory } from "../hooks/useFixedExpenseHistory"
import { useRecordFixedExpenseAmount } from "../hooks/useRecordFixedExpenseAmount"
import {
  autoDebitSourceLabel,
  formatPeriodLabel,
  frequencyLabel,
  upcomingAmountPeriods,
} from "../utils/frequency"
import { fixedExpenseStatusLabel } from "../utils/periodStatus"

type FixedExpenseHistoryScreenProps = NativeStackScreenProps<
  AppStackParamList,
  "FixedExpenseHistory"
>

export function FixedExpenseHistoryScreen({
  navigation,
  route,
}: FixedExpenseHistoryScreenProps) {
  const insets = useSafeAreaInsets()
  const historyQuery = useFixedExpenseHistory(route.params.fixedExpenseId)
  const recordAmount = useRecordFixedExpenseAmount()
  const history = historyQuery.data
  const periodOptions = history
    ? upcomingAmountPeriods(history.expense.created_at, history.expense.frequency)
    : []
  const [amount, setAmount] = useState("")
  const [period, setPeriod] = useState<string | null>(null)
  const selectedPeriod = period ?? periodOptions[0] ?? null

  async function handleRecordAmount() {
    if (!history || !selectedPeriod || recordAmount.isPending) return
    const parsedAmount = Number(amount.replace(",", "."))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Monto", "Escribí un monto mayor a cero.")
      return
    }

    try {
      await recordAmount.mutateAsync({
        fixedExpenseId: history.expense.id,
        period: selectedPeriod,
        amount: parsedAmount,
      })
      setAmount("")
      await historyQuery.refetch()
    } catch (error) {
      Alert.alert(
        "No se pudo ajustar el monto",
        error instanceof Error ? error.message : "Probá de nuevo en un momento.",
      )
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
      style={styles.screen}
    >
      <BackLink onPress={() => navigation.goBack()} />

      {historyQuery.isLoading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : historyQuery.isError || !history ? (
        <View style={styles.block}>
          <Text style={styles.message}>No se pudo cargar el historial.</Text>
          <Button label="Reintentar" onPress={() => void historyQuery.refetch()} tone="brand" />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>
              {history.expense.category?.icon ? `${history.expense.category.icon} ` : ""}
              {history.expense.name}
            </Text>
            <Text style={styles.meta}>
              {frequencyLabel(history.expense.frequency)}
              {" · cobra el "}
              {String(history.expense.charge_day).padStart(2, "0")}
              {" · vence el "}
              {String(history.expense.due_day).padStart(2, "0")}
            </Text>
            {history.expense.auto_debit && history.expense.auto_debit_source ? (
              <Text style={styles.meta}>
                Débito automático · {autoDebitSourceLabel(history.expense.auto_debit_source)}
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ajustar monto</Text>
            <Text style={styles.message}>
              El monto nuevo rige desde el período que elijas. Los anteriores conservan el esperado que tenían.
            </Text>
            <TextInput
              accessibilityLabel="Nuevo monto"
              keyboardType="decimal-pad"
              onChangeText={setAmount}
              placeholder="Nuevo monto"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
              value={amount}
            />
            {periodOptions.length > 0 ? (
              <OptionChips
                accessibilityLabel="Período desde el que rige el monto"
                onChange={setPeriod}
                options={periodOptions.map((option) => ({
                  value: option,
                  label: formatPeriodLabel(option),
                }))}
                value={selectedPeriod}
              />
            ) : null}
            <Button
              disabled={recordAmount.isPending || !selectedPeriod}
              label={recordAmount.isPending ? "Guardando..." : "Guardar monto"}
              onPress={() => void handleRecordAmount()}
              tone="brand"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cambios de monto</Text>
            {history.amountChanges.length === 0 ? (
              <Text style={styles.message}>Todavía no hay cambios de monto.</Text>
            ) : (
              history.amountChanges.map((change) => (
                <View key={change.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{formatPeriodLabel(change.effectivePeriod)}</Text>
                  <Text style={styles.rowAmount}>{formatMoney(change.amount)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Períodos</Text>
            {history.periods.length === 0 ? (
              <Text style={styles.message}>Todavía no hay períodos registrados.</Text>
            ) : (
              history.periods.map((periodItem) => (
                <View key={periodItem.id} style={styles.periodCard}>
                  <View style={styles.row}>
                    <Text style={styles.rowTitle}>{formatPeriodLabel(periodItem.period)}</Text>
                    <Text style={styles.status}>{fixedExpenseStatusLabel(periodItem.status)}</Text>
                  </View>
                  <Text style={styles.meta}>
                    Esperado {formatMoney(periodItem.expectedAmount)}
                    {" · pagado "}
                    {formatMoney(periodItem.totalPaid)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: 18,
    paddingHorizontal: layout.sectionInset,
  },
  loader: {
    marginTop: 32,
  },
  block: {
    gap: 16,
  },
  header: {
    gap: 6,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 28,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 18,
    lineHeight: 24,
  },
  message: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.field,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.foreground,
    fontFamily: fonts.sans,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  rowTitle: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  rowAmount: {
    color: colors.foreground,
    fontFamily: fonts.monoSemibold,
    fontSize: 15,
  },
  periodCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  status: {
    color: colors.mutedForeground,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
})
