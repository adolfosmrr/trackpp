import { Pressable, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../../components/feedback/EmptyState"
import { formatMoney } from "../../../utils/formatMoney"
import { colors, fonts, radii } from "../../../theme"
import {
  getCurrentFixedExpensePeriod,
  useFixedExpensePeriods,
} from "../../fixedExpenses/hooks/useFixedExpensePeriods"
import { useFixedExpenses } from "../../fixedExpenses/hooks/useFixedExpenses"
import type { FixedExpense } from "../../fixedExpenses/types"

type FixedExpensesPreviewProps = {
  onViewAll: () => void
  onCreate: () => void
  onEdit: (expense: FixedExpense, period: string) => void
}

export function FixedExpensesPreview({
  onViewAll,
  onCreate,
  onEdit,
}: FixedExpensesPreviewProps) {
  const expensesQuery = useFixedExpenses()
  const period = getCurrentFixedExpensePeriod()
  const periodsQuery = useFixedExpensePeriods(
    expensesQuery.data !== undefined && expensesQuery.data.length > 0,
    period,
  )
  const expenses = expensesQuery.data ?? []
  const preview = expenses.slice(0, 3)

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Gastos fijos</Text>
        {expenses.length ? (
          <Pressable accessibilityRole="button" onPress={onViewAll} style={styles.viewAll}>
            <Text style={styles.viewAllText}>Ver todos</Text>
          </Pressable>
        ) : null}
      </View>

      {expensesQuery.isLoading || (expenses.length > 0 && periodsQuery.isLoading) ? (
        <Text style={styles.status}>Cargando gastos fijos...</Text>
      ) : expensesQuery.isError ? (
        <Text style={styles.status}>No se pudieron cargar los gastos fijos.</Text>
      ) : expenses.length === 0 ? (
        <EmptyState
          title="Todavía no tenés gastos fijos"
          body="Sumá alquiler, servicios o suscripciones para verlos junto al presupuesto."
          actionLabel="Agregar gasto fijo"
          onAction={onCreate}
        />
      ) : (
        <View style={styles.list}>
          {preview.map((expense) => {
            const expensePeriod = periodsQuery.data?.find(
              (entry) => entry.fixedExpenseId === expense.id,
            )
            return (
              <Pressable
                key={expense.id}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${expense.name}`}
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
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  viewAll: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
  },
  viewAllText: {
    color: colors.brand,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  status: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  list: {
    gap: 10,
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
})
