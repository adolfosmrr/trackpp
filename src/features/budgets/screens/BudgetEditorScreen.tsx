import { useEffect, useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "../../../components/buttons/Button"
import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { FieldRow, TextField } from "../../../components/inputs/TextField"
import { useCategories } from "../../categories/hooks/useCategories"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"
import type { AppStackParamList } from "../../../navigation/types"
import { colors, fonts } from "../../../theme"
import { useCreateBudget } from "../hooks/useCreateBudget"
import { useUpdateBudget } from "../hooks/useUpdateBudget"

type BudgetEditorScreenProps = NativeStackScreenProps<AppStackParamList, "BudgetEditor">

export function BudgetEditorScreen({ navigation, route }: BudgetEditorScreenProps) {
  const insets = useSafeAreaInsets()
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
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {isCreate ? "Crear presupuesto" : "Editar presupuesto"}
      </Text>
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
          <Text style={styles.fieldLabel}>Categoría</Text>
          <View style={styles.fieldValueGroup}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.fieldValue}>
              {request.kind === "edit"
                ? request.budget.category.name
                : selectedCategory?.name ?? "Seleccionar categoría"}
            </Text>
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
  },
  fieldsStack: {
    gap: 11,
    marginTop: 40,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 20,
    fontWeight: "600",
  },
  fieldLabel: {
    color: colors.foreground,
    flexShrink: 0,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 16,
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
    color: colors.mutedForeground,
    flex: 1,
    flexShrink: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 18,
    textAlign: "right",
  },
})
