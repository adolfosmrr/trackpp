import { forwardRef, useRef, useState } from "react"
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetModal,
  BottomSheetView,
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
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.6}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
      onDismiss={onDismiss}
      backdropComponent={(props) => <TransactionBlurBackdrop {...props} />}
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
        <BudgetForm request={request} onSuccess={onSuccess} />
      </BottomSheetView>
    </BottomSheetModal>
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
        <TextInput
          style={[styles.field, styles.input]}
          placeholder="Nombre del presupuesto"
          placeholderTextColor="rgba(28, 28, 28, 0.5)"
          value={name}
          onChangeText={setName}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !isCreate }}
          disabled={!isCreate}
          onPress={openCategorySelector}
          style={[styles.field, styles.darkField]}
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
        </Pressable>

        <TextInput
          style={[styles.field, styles.input]}
          placeholder={isCreate ? "Monto mensual" : "Nuevo monto"}
          placeholderTextColor="rgba(28, 28, 28, 0.5)"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Pressable
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          <Text style={styles.buttonText}>
            {isCreate
              ? isPending ? "Creando..." : "Crear presupuesto"
              : isPending ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>
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
  background: {
    backgroundColor: "#E6E6E6",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  handleIndicator: {
    backgroundColor: "#1c1c1c",
  },
  content: {
    padding: 24,
  },
  fieldsStack: {
    gap: 11,
    marginTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  field: {
    width: "100%",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  input: {
    backgroundColor: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
  },
  darkField: {
    alignItems: "center",
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fieldLabel: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
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
    color: "#FFFFFF",
    flex: 1,
    flexShrink: 1,
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
    opacity: 0.5,
    textAlign: "right",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 999,
    padding: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "FamiljenGrotesk-Bold",
  },
})
