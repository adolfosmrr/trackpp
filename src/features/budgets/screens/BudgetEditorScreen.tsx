import { useEffect, useState } from "react"
import { Alert, StyleSheet, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Button } from "../../../components/buttons/Button"
import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { FieldRow, TextField } from "../../../components/inputs/TextField"
import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import { useCategories } from "../../categories/hooks/useCategories"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"
import type { AppStackParamList } from "../../../navigation/types"
import { useCreateBudget } from "../hooks/useCreateBudget"
import { useUpdateBudget } from "../hooks/useUpdateBudget"

type BudgetEditorScreenProps = NativeStackScreenProps<AppStackParamList, "BudgetEditor">

export function BudgetEditorScreen({ navigation, route }: BudgetEditorScreenProps) {
  const request = route.params?.request
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const { data: memberships } = useHouseholds()
  const categoriesQuery = useCategories("expense")
  const createBudgetMutation = useCreateBudget()
  const updateBudgetMutation = useUpdateBudget()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    request?.kind === "edit" ? request.budget.category_id : null,
  )
  const [name, setName] = useState(request?.kind === "edit" ? request.budget.name : "")
  const [amount, setAmount] = useState(
    request?.kind === "edit" ? String(request.budget.amount) : "",
  )

  const isCreate = request?.kind !== "edit"
  const isPending = isCreate ? createBudgetMutation.isPending : updateBudgetMutation.isPending
  const selectedCategory = categoriesQuery.data?.find((category) => category.id === selectedCategoryId)
  const householdName = memberships?.find(
    (membership) => membership.household_id === selectedHouseholdId,
  )?.household.name ?? ""

  useEffect(() => {
    const selection = route.params?.categorySelection
    if (!selection) return
    setSelectedCategoryId(selection.categoryId)
    navigation.setParams({ categorySelection: undefined })
  }, [navigation, route.params?.categorySelection])

  if (!request) return null

  async function handleSubmit() {
    if (!request) return

    const parsedAmount = Number(amount.replace(",", "."))
    const trimmedName = name.trim()

    if (!trimmedName || trimmedName.length > 100) {
      Alert.alert("Error", "El nombre debe tener entre 1 y 100 caracteres.")
      return
    }

    if (isCreate && !selectedCategoryId) {
      Alert.alert("Error", "Selecciona una categoría.")
      return
    }

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Error", "Escribe un monto válido.")
      return
    }

    try {
      if (request.kind === "create") {
        if (!selectedCategoryId) return
        await createBudgetMutation.mutateAsync({
          name: trimmedName,
          categoryId: selectedCategoryId,
          amount: parsedAmount,
        })
      } else {
        await updateBudgetMutation.mutateAsync({
          budgetId: request.budget.id,
          name: trimmedName,
          amount: parsedAmount,
        })
      }
      navigation.goBack()
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : isCreate
          ? "No se pudo crear el presupuesto."
          : "No se pudo actualizar el presupuesto."
      Alert.alert("Error", message)
    }
  }

  function openCategorySelector() {
    if (!isCreate || !selectedHouseholdId) return
    navigation.navigate("CategoryPicker", {
      returnTo: "BudgetEditor",
      householdId: selectedHouseholdId,
      householdName,
      entryType: "expense",
      selectedCategoryId,
    })
  }

  return (
    <SheetScaffold
      onClose={() => navigation.goBack()}
      title={isCreate ? "Crear presupuesto" : "Editar presupuesto"}
    >
      <View style={styles.fieldsStack}>
        <TextField
          placeholder="Nombre del presupuesto"
          value={name}
          onChangeText={setName}
        />
        <FieldRow
          accessibilityState={{ disabled: !isCreate }}
          disabled={!isCreate}
          onPress={openCategorySelector}
        >
          <AppText style={styles.fieldLabel} variant="subtitle">Categoría</AppText>
          <View style={styles.fieldValueGroup}>
            <AppText numberOfLines={1} ellipsizeMode="tail" style={styles.fieldValue} tone="muted" variant="subtitle">
              {request.kind === "edit"
                ? request.budget.category.name
                : selectedCategory?.name ?? "Seleccionar categoría"}
            </AppText>
            <FieldChevronIcon />
          </View>
        </FieldRow>
        <TextField
          placeholder={isCreate ? "Monto mensual" : "Nuevo monto"}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <Button
          disabled={isPending}
          label={isCreate
            ? isPending ? "Creando..." : "Crear presupuesto"
            : isPending ? "Guardando..." : "Guardar cambios"}
          onPress={() => {
            void handleSubmit()
          }}
          tone="brand"
        />
      </View>
    </SheetScaffold>
  )
}

const styles = StyleSheet.create({
  fieldsStack: {
    gap: 11,
  },
  fieldLabel: {
    flexShrink: 0,
  },
  fieldValueGroup: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginLeft: 12,
    minWidth: 0,
  },
  fieldValue: {
    flex: 1,
    flexShrink: 1,
    textAlign: "right",
  },
})
