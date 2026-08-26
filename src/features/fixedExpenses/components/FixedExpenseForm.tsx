import { useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native"

import { useCategories } from "../../categories/hooks/useCategories"
import type { FixedExpenseInput } from "../types"

type FixedExpenseFormProps = {
  initialValues?: FixedExpenseInput
  submitLabel: string
  isPending: boolean
  onSubmit: (values: FixedExpenseInput) => Promise<void>
}

export function FixedExpenseForm({
  initialValues,
  submitLabel,
  isPending,
  onSubmit,
}: FixedExpenseFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "")
  const [amount, setAmount] = useState(
    initialValues?.amount.toString() ?? ""
  )
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId ?? null
  )
  const [chargeDay, setChargeDay] = useState(
    initialValues?.chargeDay.toString() ?? "1"
  )
  const [dueDay, setDueDay] = useState(
    initialValues?.dueDay.toString() ?? "10"
  )
  const { data: categories, isLoading, isError } = useCategories("expense")

  async function handleSubmit() {
    try {
      const parsedAmount = Number(amount.replace(",", "."))
      const parsedChargeDay = Number(chargeDay)
      const parsedDueDay = Number(dueDay)

      if (name.trim().length < 1 || name.trim().length > 100) {
        throw new Error("El nombre debe tener entre 1 y 100 caracteres.")
      }

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Escribe un monto válido.")
      }

      if (!categoryId) {
        throw new Error("Selecciona una categoría.")
      }

      if (!isValidDay(parsedChargeDay) || !isValidDay(parsedDueDay)) {
        throw new Error("Los días deben estar entre 1 y 31.")
      }

      await onSubmit({
        name: name.trim(),
        amount: parsedAmount,
        categoryId,
        chargeDay: parsedChargeDay,
        dueDay: parsedDueDay,
        isActive: initialValues?.isActive ?? true,
      })
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo guardar el gasto fijo.")
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        maxLength={100}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Monto"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Categoría</Text>
        {isLoading ? <ActivityIndicator /> : null}
        {isError ? (
          <Text style={styles.error}>No se pudieron cargar las categorías.</Text>
        ) : (
          <View style={styles.chips}>
            {categories?.map((category) => {
              const selected = category.id === categoryId
              return (
                <Pressable
                  key={category.id}
                  style={[styles.chip, selected && styles.selectedChip]}
                  onPress={() => setCategoryId(category.id)}
                >
                  <Text style={selected ? styles.selectedChipText : styles.chipText}>
                    {category.icon ? `${category.icon} ` : ""}{category.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}
      </View>

      <DayInput label="Día de cobro" value={chargeDay} onChangeText={setChargeDay} />
      <DayInput label="Día de vencimiento" value={dueDay} onChangeText={setDueDay} />

      <Pressable
        style={[styles.button, isPending && styles.disabled]}
        onPress={() => void handleSubmit()}
        disabled={isPending}
      >
        <Text style={styles.buttonText}>{isPending ? "Guardando..." : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  )
}

function DayInput({
  label,
  value,
  onChangeText,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder="1 a 31"
        keyboardType="number-pad"
        maxLength={2}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  )
}

function isValidDay(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 31
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 14 },
  section: { gap: 10 },
  label: { fontSize: 16, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9 },
  selectedChip: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { fontWeight: "600" },
  selectedChipText: { color: "#fff", fontWeight: "600" },
  error: { color: "#b42318" },
  button: { marginTop: 8, padding: 16, borderRadius: 10, backgroundColor: "#111", alignItems: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
})
