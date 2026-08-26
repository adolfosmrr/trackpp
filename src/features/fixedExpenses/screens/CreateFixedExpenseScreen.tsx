import { Alert } from "react-native"

import { FixedExpenseForm } from "../components/FixedExpenseForm"
import { useCreateFixedExpense } from "../hooks/useCreateFixedExpense"

export function CreateFixedExpenseScreen({ navigation }: any) {
  const mutation = useCreateFixedExpense()

  async function handleSubmit(values: Parameters<typeof mutation.mutateAsync>[0]) {
    try {
      await mutation.mutateAsync(values)
      navigation.goBack()
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo crear el gasto fijo.")
    }
  }

  return (
    <FixedExpenseForm
      submitLabel="Guardar gasto fijo"
      isPending={mutation.isPending}
      onSubmit={handleSubmit}
    />
  )
}
