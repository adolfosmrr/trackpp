import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../../components/feedback/EmptyState"
import { formatMoney } from "../../../utils/formatMoney"
import { colors, fonts, radii } from "../../../theme"
import {
  getCurrentFixedExpensePeriod,
  useFixedExpensePeriods,
} from "../hooks/useFixedExpensePeriods"
import { useFixedExpenses } from "../hooks/useFixedExpenses"
import type { FixedExpense, FixedExpensePeriod, FixedExpensePeriodStatus } from "../types"

type FixedExpenseListProps = {
  onCreate: () => void
  onEdit: (expense: FixedExpense, period: string) => void
  emptyBody?: string
  variant?: "summary" | "detail"
  renderActions?: (
    expense: FixedExpense,
    period: FixedExpensePeriod | undefined,
  ) => ReactNode
}

const SUMMARY_EMPTY_BODY = "Sumá alquiler, servicios o suscripciones para seguirlos cada mes."

export function FixedExpenseList({
  onCreate,
  onEdit,
  emptyBody = SUMMARY_EMPTY_BODY,
  variant = "summary",
  renderActions,
}: FixedExpenseListProps) {
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
    <View style={variant === "detail" ? styles.detailList : styles.list}>
      {expenses.map((expense) => {
        const expensePeriod = periodsQuery.data?.find(
          (entry) => entry.fixedExpenseId === expense.id,
        )

        if (variant === "detail") {
          return (
            <View key={expense.id} style={styles.card}>
              <Pressable
                accessibilityLabel={`Editar ${expense.name}`}
                accessibilityRole="button"
                onPress={() => onEdit(expense, period)}
              >
                <View style={styles.cardHeader}>
                  <Text numberOfLines={1} style={styles.detailName}>
                    {expensePeriod?.category?.icon ?? expense.category?.icon
                      ? `${expensePeriod?.category?.icon ?? expense.category?.icon} `
                      : ""}
                    {expensePeriod?.name ?? expense.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.detailAmount}>
                    {formatMoney(expensePeriod?.expectedAmount ?? expense.amount)}
                  </Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoText}>
                      Inicia: {String(expense.charge_day).padStart(2, "0")} cada mes
                    </Text>
                    <Text style={styles.infoText}>
                      Vence: {String(expense.due_day).padStart(2, "0")} cada mes
                    </Text>
                  </View>
                  <View style={styles.infoColumn}>
                    {expensePeriod ? (
                      <>
                        <Text style={styles.infoText}>
                          Pagado: {formatMoney(expensePeriod.totalPaid)}
                        </Text>
                        <Text style={styles.infoText}>
                          Pendiente: {formatMoney(expensePeriod.remaining)}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>

                <View style={styles.separator} />

                {expensePeriod ? (
                  <View style={styles.statusProgress}>
                    <Text style={styles.periodStatus}>{getStatusLabel(expensePeriod.status)}</Text>
                    <PaymentProgress period={expensePeriod} />
                  </View>
                ) : null}
              </Pressable>
              {renderActions?.(expense, expensePeriod)}
            </View>
          )
        }

        return (
          <Pressable
            key={expense.id}
            accessibilityLabel={`Editar ${expense.name}`}
            accessibilityRole="button"
            onPress={() => onEdit(expense, period)}
            style={styles.row}
          >
            <Text numberOfLines={1} style={styles.name}>
              {expense.category?.icon ? `${expense.category.icon} ` : ""}
              {expense.name}
            </Text>
            <Text style={styles.amount}>
              {formatMoney(expensePeriod?.remaining ?? expense.amount)}
            </Text>
          </Pressable>
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

function getStatusLabel(status: FixedExpensePeriodStatus) {
  switch (status) {
    case "upcoming": return "Próximo"
    case "pending": return "Pendiente"
    case "partial": return "Parcial"
    case "paid": return "Pagado"
    case "overdue": return "Vencido"
  }
}

const styles = StyleSheet.create({
  status: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  list: {
    gap: 10,
  },
  detailList: {
    gap: 12,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  name: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  amount: {
    color: colors.foreground,
    fontFamily: fonts.monoSemibold,
    fontSize: 15,
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
    lineHeight: 12,
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
