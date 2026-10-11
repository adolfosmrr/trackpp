import { Pressable, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../../components/feedback/EmptyState"
import { formatMoney } from "../../../utils/formatMoney"
import { colors, fonts, radii } from "../../../theme"
import {
  getCurrentFixedExpensePeriod,
  useFixedExpensePeriods,
} from "../hooks/useFixedExpensePeriods"
import { useFixedExpenses } from "../hooks/useFixedExpenses"
import type { FixedExpense } from "../types"

type FixedExpenseListProps = {
  onCreate: () => void
  onEdit: (expense: FixedExpense, period: string) => void
}

export function FixedExpenseList({ onCreate, onEdit }: FixedExpenseListProps) {
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
        body="Sumá alquiler, servicios o suscripciones para seguirlos cada mes."
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

const styles = StyleSheet.create({
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
