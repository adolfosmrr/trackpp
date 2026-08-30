import { useState } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { useCategories } from "../../categories/hooks/useCategories"
import { useCreateTransaction } from "../hooks/useCreateTransaction"

type CreateTransactionFormProps = {
  onSuccess?: () => void
}

export function CreateTransactionForm({ onSuccess }: CreateTransactionFormProps) {
  const [type, setType] = useState<"expense" | "income">("expense")
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const createTransactionMutation = useCreateTransaction()

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories(type)

  function handleTypeChange(newType: "expense" | "income") {
    setType(newType)
    setSelectedCategoryId(null)
  }

  async function handleCreate() {
    if (!title.trim()) {
      Alert.alert("Error", "Escribe un título.")
      return
    }

    const parsedAmount = Number(amount.replace(",", "."))
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Error", "Escribe un monto válido.")
      return
    }

    if (!selectedCategoryId) {
      Alert.alert("Error", "Selecciona una categoría.")
      return
    }

    try {
      await createTransactionMutation.mutateAsync({
        type,
        title: title.trim(),
        amount: parsedAmount,
        categoryId: selectedCategoryId,
      })
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "No se pudo crear el movimiento."
      Alert.alert("Error", message)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.typeContainer}>
        <Pressable
          style={[styles.typeButton, type === "expense" && styles.typeButtonSelected]}
          onPress={() => handleTypeChange("expense")}
        >
          <Text style={[styles.typeText, type === "expense" && styles.typeTextSelected]}>
            Gasto
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeButton, type === "income" && styles.typeButtonSelected]}
          onPress={() => handleTypeChange("income")}
        >
          <Text style={[styles.typeText, type === "income" && styles.typeTextSelected]}>
            Ingreso
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Monto"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Categoría</Text>
        {categoriesLoading ? (
          <Text style={styles.helperText}>Cargando categorías...</Text>
        ) : categoriesError ? (
          <Text style={styles.errorText}>No se pudieron cargar las categorías.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {categories?.map((category) => {
              const isSelected = selectedCategoryId === category.id
              return (
                <Pressable
                  key={category.id}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategoryId(category.id)}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                    {category.icon ? `${category.icon} ` : ""}
                    {category.name}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        )}
      </View>

      <Pressable
        style={[styles.button, createTransactionMutation.isPending && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={createTransactionMutation.isPending}
      >
        <Text style={styles.buttonText}>
          {createTransactionMutation.isPending ? "Guardando..." : "Guardar movimiento"}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  typeContainer: { flexDirection: "row", gap: 10 },
  typeButton: {
    alignItems: "center",
    borderColor: "#ccc",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  typeButtonSelected: { backgroundColor: "#111", borderColor: "#111" },
  typeText: { fontWeight: "600" },
  typeTextSelected: { color: "#fff" },
  input: { borderColor: "#ccc", borderRadius: 10, borderWidth: 1, padding: 14 },
  categorySection: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  categoriesList: { gap: 10 },
  categoryChip: {
    borderColor: "#ccc",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryChipSelected: { backgroundColor: "#111", borderColor: "#111" },
  categoryChipText: { fontWeight: "600" },
  categoryChipTextSelected: { color: "#fff" },
  helperText: { color: "#777" },
  errorText: { color: "#b42318" },
  button: {
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    marginTop: 10,
    padding: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
})
