import { forwardRef, useRef, useState } from "react"
import {
  Alert,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native"
import { Button } from "../../../components/buttons/Button"
import { FieldRow, fieldStyles } from "../../../components/inputs/TextField"
import { AppSheet } from "../../../components/layout/AppSheet"
import { colors, fonts } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet"

import { useCategories } from "../../categories/hooks/useCategories"
import type { Category } from "../../categories/types"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"
import { useCreateBudget } from "../hooks/useCreateBudget"
import { useUpdateBudget } from "../hooks/useUpdateBudget"
import type { BudgetSheetRequest } from "../types"
import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { CategorySelectorSheet } from "../../transactions/components/CategorySelectorSheet"
import { TransactionBlurBackdrop } from "../../transactions/components/TransactionBlurBackdrop"

type BudgetBottomSheetProps = {
  request: BudgetSheetRequest
  onDismiss: () => void
  onSuccess: () => void
}

export const BudgetBottomSheet = forwardRef<
  BottomSheetModal,
  BudgetBottomSheetProps
>(function BudgetBottomSheet({ request, onDismiss, onSuccess }, ref) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  return (
    <AppSheet
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.6}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={styles.handleIndicator}
      onDismiss={onDismiss}
      backdropComponent={(props) => <TransactionBlurBackdrop {...props} />}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <BudgetForm request={request} onSuccess={onSuccess} />
      </BottomSheetScrollView>
    </AppSheet>
  )
})

function BudgetForm({
  request,
  onSuccess,
}: Pick<BudgetBottomSheetProps, "request" | "onSuccess">) {
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )
  const { data: memberships } = useHouseholds()
  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories("expense")
  const createBudgetMutation = useCreateBudget()
  const updateBudgetMutation = useUpdateBudget()
  const categorySelectorRef = useRef<BottomSheetModal>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    request.kind === "create" ? null : request.budget.category_id
  )
  const [name, setName] = useState(
    request.kind === "create" ? "" : request.budget.name
  )
  const [amount, setAmount] = useState(
    request.kind === "create" ? "" : String(request.budget.amount)
  )

  const isCreate = request.kind === "create"
  const isPending = isCreate
    ? createBudgetMutation.isPending
    : updateBudgetMutation.isPending

  const selectedCategory = categories?.find(
    (category) => category.id === selectedCategoryId
  )
  const householdName = memberships?.find(
    (membership) => membership.household_id === selectedHouseholdId
  )?.household.name ?? ""

  async function handleSubmit() {
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
      if (isCreate) {
        await createBudgetMutation.mutateAsync({
          name: trimmedName,
          categoryId: selectedCategoryId!,
          amount: parsedAmount,
        })
      } else {
        await updateBudgetMutation.mutateAsync({
          budgetId: request.budget.id,
          name: trimmedName,
          amount: parsedAmount,
        })
      }

      onSuccess()
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
    categorySelectorRef.current?.present()
  }

  function handleCategorySelect(category: Category) {
    setSelectedCategoryId(category.id)
    categorySelectorRef.current?.dismiss()
  }

  return (
    <View style={styles.content}>
      <Text style={styles.title}>
        {isCreate ? "Crear presupuesto" : "Editar presupuesto"}
      </Text>

      <View style={styles.fieldsStack}>
        <BottomSheetTextInput
          style={[fieldStyles.surface, fieldStyles.text, fieldStyles.pill]}
          placeholder="Nombre del presupuesto"
          placeholderTextColor={colors.mutedForeground}
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
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.fieldValue}
            >
              {isCreate
                ? selectedCategory?.name ?? "Seleccionar categoría"
                : request.budget.category.name}
            </Text>
            <FieldChevronIcon />
          </View>
        </FieldRow>

        <BottomSheetTextInput
          style={[fieldStyles.surface, fieldStyles.text, fieldStyles.pill]}
          placeholder={isCreate ? "Monto mensual" : "Nuevo monto"}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Button
          disabled={isPending}
          label={isCreate
            ? isPending ? "Creando..." : "Crear presupuesto"
            : isPending ? "Guardando..." : "Guardar cambios"}
          onPress={handleSubmit}
          tone="brand"
        />
      </View>

      {isCreate ? (
        <CategorySelectorSheet
          ref={categorySelectorRef}
          householdName={householdName}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          isLoading={categoriesLoading}
          hasError={categoriesError}
          onSelect={handleCategorySelect}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.borderStrong,
  },
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
    fontFamily: fonts.sansMedium,
    flexShrink: 0,
    fontSize: 16,
    lineHeight: 16,
  },
  fieldValueGroup: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
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
