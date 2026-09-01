import { forwardRef, useState } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
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
import { useCreateBudget } from "../hooks/useCreateBudget"
import { useUpdateBudget } from "../hooks/useUpdateBudget"
import type { BudgetSheetRequest } from "../types"
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
  const { data: categories } = useCategories("expense")
  const createBudgetMutation = useCreateBudget()
  const updateBudgetMutation = useUpdateBudget()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    request.kind === "create" ? null : request.budget.category_id
  )
  const [amount, setAmount] = useState(
    request.kind === "create" ? "" : String(request.budget.amount)
  )

  const isCreate = request.kind === "create"
  const isPending = isCreate
    ? createBudgetMutation.isPending
    : updateBudgetMutation.isPending

  async function handleSubmit() {
    const parsedAmount = Number(amount.replace(",", "."))

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
          categoryId: selectedCategoryId!,
          amount: parsedAmount,
        })
      } else {
        await updateBudgetMutation.mutateAsync({
          budgetId: request.budget.id,
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

  return (
    <View style={styles.content}>
      <Text style={styles.title}>
        {isCreate ? "Crear presupuesto" : "Editar presupuesto"}
      </Text>

      {isCreate ? (
        <>
          <Text style={styles.label}>Categoría</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {categories?.map((category) => {
              const selected = selectedCategoryId === category.id

              return (
                <Pressable
                  key={category.id}
                  style={[
                    styles.category,
                    selected && styles.categorySelected,
                  ]}
                  onPress={() => setSelectedCategoryId(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected && styles.categoryTextSelected,
                    ]}
                  >
                    {category.icon ? `${category.icon} ` : ""}
                    {category.name}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </>
      ) : (
        <Text style={styles.modalCategory}>
          {request.budget.category.icon ?? ""}{" "}
          {request.budget.category.name}
        </Text>
      )}

      <TextInput
        style={styles.input}
        placeholder={isCreate ? "Monto mensual" : "Nuevo monto"}
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
    gap: 16,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  categories: {
    gap: 10,
  },
  category: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 999,
  },
  categorySelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  categoryText: {
    fontWeight: "500",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  modalCategory: {
    fontSize: 16,
    color: "#777",
  },
})
