import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../../components/feedback/EmptyState"
import { useFormatMoney } from "../../households/hooks/useFormatMoney"
import { colors, fonts, radii } from "../../../theme"
import {
  getCurrentFixedExpensePeriod,
  useFixedExpensePeriods,
} from "../hooks/useFixedExpensePeriods"
import { useFixedExpenses } from "../hooks/useFixedExpenses"
import type { FixedExpense, FixedExpensePeriod } from "../types"
import { autoDebitSourceLabel, frequencyLabel } from "../utils/frequency"
import { fixedExpenseStatusLabel } from "../utils/periodStatus"

type FixedExpenseListProps = {
  onCreate: () => void
  onOpenHistory: (expense: FixedExpense) => void
  emptyBody?: string
  renderActions?: (
    expense: FixedExpense,
    period: FixedExpensePeriod | undefined,
  ) => ReactNode
}

const EMPTY_BODY = "Sumá alquiler, servicios o suscripciones para seguirlos cada mes."

export function FixedExpenseList({
  onCreate,
  onOpenHistory,
  emptyBody = EMPTY_BODY,
  renderActions,
}: FixedExpenseListProps) {
  const format = useFormatMoney()
  const expensesQuery = useFixedExpenses()
  const period = getCurrentFixedExpensePeriod()
  const expenses = expensesQuery.data ?? []
  const periodsQuery = useFixedExpensePeriods(expenses.length > 0, period)

  if (expensesQuery.isLoading || (expenses.length > 0 && periodsQuery.isLoading)) {
    return <Text style={styles.status}>Cargando gastos fijos...</Text>
  }

  if (expensesQuery.isError) {
    return <Text style={styles.status}>No se pudieron cargar los gastos fijos.</Text>
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        title="Todavía no tenés gastos fijos"
        body={emptyBody}
        actionLabel="Agregar gasto fijo"
        onAction={onCreate}
      />
    )
  }

  return (
    <View style={styles.list}>
      {expenses.map((expense) => {
        const expensePeriod = periodsQuery.data?.find(
          (entry) => entry.fixedExpenseId === expense.id,
        )

        return (
          <View key={expense.id} style={styles.card}>
            <Pressable
              accessibilityLabel={`Ver historial de ${expense.name}`}
              accessibilityRole="button"
              onPress={() => onOpenHistory(expense)}
            >
              <View style={styles.cardHeader}>
                <Text numberOfLines={1} style={styles.detailName}>
                  {expensePeriod?.category?.icon ?? expense.category?.icon
                    ? `${expensePeriod?.category?.icon ?? expense.category?.icon} `
                    : ""}
                  {expensePeriod?.name ?? expense.name}
                </Text>
                <Text numberOfLines={1} style={styles.detailAmount}>
                  {format(expensePeriod?.expectedAmount ?? expense.amount)}
                </Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoText}>
                    {frequencyLabel(expense.frequency)}
                  </Text>
                  <Text style={styles.infoText}>
                    Cobra: {String(expense.charge_day).padStart(2, "0")}
                  </Text>
                  <Text style={styles.infoText}>
                    Vence: {String(expense.due_day).padStart(2, "0")}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  {expense.auto_debit && expense.auto_debit_source ? (
                    <Text style={styles.infoText}>
                      Débito · {autoDebitSourceLabel(expense.auto_debit_source)}
                    </Text>
                  ) : null}
                  {expensePeriod ? (
                    <>
                      <Text style={styles.infoText}>
                        Pagado: {format(expensePeriod.totalPaid)}
                      </Text>
                      <Text style={styles.infoText}>
                        Pendiente: {format(expensePeriod.remaining)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.infoText}>Sin período este mes</Text>
                  )}
                </View>
              </View>

              <View style={styles.separator} />

              {expensePeriod ? (
                <View style={styles.statusProgress}>
                  <Text style={styles.periodStatus}>
                    {fixedExpenseStatusLabel(expensePeriod.status)}
                  </Text>
                  <PaymentProgress period={expensePeriod} />
                </View>
              ) : null}
            </Pressable>
            {renderActions?.(expense, expensePeriod)}
          </View>
        )
      })}
    </View>
  )
}

function PaymentProgress({ period }: { period: FixedExpensePeriod }) {
  const paymentPercentage = period.expectedAmount > 0
    ? (period.totalPaid / period.expectedAmount) * 100
    : 0
  const progressPercentage = Math.max(0, Math.min(paymentPercentage, 100))
  const visiblePercentage = Math.round(progressPercentage)

  return (
    <View accessible accessibilityLabel={`${visiblePercentage}% pagado`} style={styles.progressSection}>
      <Text style={styles.progressLabel}>{visiblePercentage}% pagado</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  status: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailName: {
    color: colors.foreground,
    flex: 1,
    flexShrink: 1,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
  },
  detailAmount: {
    color: colors.foreground,
    flexShrink: 1,
    fontFamily: fonts.monoSemibold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "right",
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
    width: "100%",
  },
  infoGrid: {
    flexDirection: "row",
    marginVertical: 15,
    width: "100%",
  },
  infoColumn: {
    gap: 8,
    width: "50%",
  },
  infoText: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  statusProgress: {
    gap: 8,
    marginTop: 15,
  },
  periodStatus: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 16,
  },
  progressSection: {
    gap: 6,
  },
  progressLabel: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 12,
  },
  progressTrack: {
    backgroundColor: colors.control,
    borderRadius: radii.xs,
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.brand,
    borderRadius: radii.xs,
    height: "100%",
  },
})
