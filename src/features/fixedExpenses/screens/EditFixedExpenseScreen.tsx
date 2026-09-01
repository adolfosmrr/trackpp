import { Alert, ActivityIndicator, Text, View } from "react-native"

import { FixedExpenseForm } from "../components/FixedExpenseForm"
import { getCurrentFixedExpensePeriod } from "../hooks/useFixedExpensePeriods"
import { useFixedExpenses } from "../hooks/useFixedExpenses"
import { useUpdateFixedExpense } from "../hooks/useUpdateFixedExpense"
import type { FixedExpenseInput } from "../types"

export function EditFixedExpenseScreen({ route, navigation }: any) {
  const mutation = useUpdateFixedExpense()
  const { data: expenses, isLoading } = useFixedExpenses()
  const expense = expenses?.find((item) => item.id === route.params.fixedExpenseId)

  async function handleSubmit(values: FixedExpenseInput) {
    if (!expense) return

    try {
      await mutation.mutateAsync({
        fixedExpenseId: expense.id,
        period: route.params.period ?? getCurrentFixedExpensePeriod(),
        ...values,
      })
      navigation.goBack()
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo actualizar el gasto fijo.")
    }
  }

  if (isLoading) {
    return <ActivityIndicator />
  }

  if (!expense) {
    return <View><Text>No se encontró el gasto fijo.</Text></View>
  }

  return (
    <FixedExpenseForm
      initialValues={{
        name: expense.name,
        amount: expense.amount,
        categoryId: expense.category_id,
        chargeDay: expense.charge_day,
        dueDay: expense.due_day,
        isActive: expense.is_active,
      }}
      submitLabel="Guardar cambios"
      isPending={mutation.isPending}
      onSubmit={handleSubmit}
    />
  )
}
