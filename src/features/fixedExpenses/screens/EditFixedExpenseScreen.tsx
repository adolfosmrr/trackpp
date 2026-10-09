import { Alert, ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BackLink } from "../../../components/navigation/BackLink"
import { colors, fonts } from "../../../theme"

import { FixedExpenseForm } from "../components/FixedExpenseForm"
import { getCurrentFixedExpensePeriod } from "../hooks/useFixedExpensePeriods"
import { useFixedExpenses } from "../hooks/useFixedExpenses"
import { useUpdateFixedExpense } from "../hooks/useUpdateFixedExpense"
import type { FixedExpenseInput } from "../types"

export function EditFixedExpenseScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets()
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
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
        <BackLink onPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </View>
    )
  }

  if (!expense) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
        <BackLink onPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.message}>No se encontró el gasto fijo.</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.backRow}>
        <BackLink onPress={() => navigation.goBack()} />
      </View>
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
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  backRow: {
    marginBottom: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  message: {
    color: colors.foreground,
    fontFamily: fonts.sans,
    textAlign: "center",
  },
})
