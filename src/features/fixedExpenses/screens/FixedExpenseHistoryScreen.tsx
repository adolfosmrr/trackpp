import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "../../../components/buttons/Button"
import { TextField } from "../../../components/inputs/TextField"
import { BackLink } from "../../../components/navigation/BackLink"
import { AppText } from "../../../components/text/AppText"
import { colors, fonts, layout, radii } from "../../../theme"
import { useFormatMoney } from "../../households/hooks/useFormatMoney"
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
  const format = useFormatMoney()
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
        { paddingTop: insets.top + layout.titleContentGap, paddingBottom: insets.bottom + layout.sheetPadding },
      ]}
      style={styles.screen}
    >
      <BackLink onPress={() => navigation.goBack()} />

      {historyQuery.isLoading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : historyQuery.isError || !history ? (
        <View style={styles.block}>
          <AppText tone="muted" variant="body">No se pudo cargar el historial.</AppText>
          <Button label="Reintentar" onPress={() => void historyQuery.refetch()} tone="brand" />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <AppText variant="title">
              {history.expense.category?.icon ? `${history.expense.category.icon} ` : ""}
              {history.expense.name}
            </AppText>
            <AppText tone="muted" variant="caption">
              {frequencyLabel(history.expense.frequency)}
              {" · cobra el "}
              {String(history.expense.charge_day).padStart(2, "0")}
              {" · vence el "}
              {String(history.expense.due_day).padStart(2, "0")}
            </AppText>
            {history.expense.auto_debit && history.expense.auto_debit_source ? (
              <AppText tone="muted" variant="caption">
                Débito automático · {autoDebitSourceLabel(history.expense.auto_debit_source)}
              </AppText>
            ) : null}
          </View>

          <View style={styles.section}>
            <AppText variant="sectionTitle">Ajustar monto</AppText>
            <AppText tone="muted" variant="body">
              El monto nuevo rige desde el período que elijas. Los anteriores conservan el esperado que tenían.
            </AppText>
            <TextField
              accessibilityLabel="Nuevo monto"
              keyboardType="decimal-pad"
              onChangeText={setAmount}
              placeholder="Nuevo monto"
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
            <AppText variant="sectionTitle">Cambios de monto</AppText>
            {history.amountChanges.length === 0 ? (
              <AppText tone="muted" variant="body">Todavía no hay cambios de monto.</AppText>
            ) : (
              history.amountChanges.map((change) => (
                <View key={change.id} style={styles.row}>
                  <AppText style={styles.rowTitle} variant="subtitle">{formatPeriodLabel(change.effectivePeriod)}</AppText>
                  <Text style={styles.rowAmount}>{format(change.amount)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <AppText variant="sectionTitle">Períodos</AppText>
            {history.periods.length === 0 ? (
              <AppText tone="muted" variant="body">Todavía no hay períodos registrados.</AppText>
            ) : (
              history.periods.map((periodItem) => (
                <View key={periodItem.id} style={styles.periodCard}>
                  <View style={styles.row}>
                    <AppText style={styles.rowTitle} variant="subtitle">{formatPeriodLabel(periodItem.period)}</AppText>
                    <AppText tone="muted" variant="caption">{fixedExpenseStatusLabel(periodItem.status)}</AppText>
                  </View>
                  <Text style={styles.rowAmount}>
                    Esperado {format(periodItem.expectedAmount)}
                    {" · pagado "}
                    {format(periodItem.totalPaid)}
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
    gap: layout.titleContentGap,
    paddingHorizontal: layout.sheetPadding,
  },
  loader: {
    marginTop: layout.titleContentGap,
  },
  block: {
    gap: layout.titleContentGap,
  },
  header: {
    gap: layout.titleContentGap,
  },
  section: {
    gap: layout.titleContentGap,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  rowTitle: {
    flex: 1,
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
})
