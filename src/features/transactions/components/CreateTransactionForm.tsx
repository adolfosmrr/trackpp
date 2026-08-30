import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { BottomSheetModal } from "@gorhom/bottom-sheet"

import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"
import { useHouseholdCategories } from "../../categories/hooks/useHouseholdCategories"
import { SegmentedToggle } from "../../../components/inputs/SegmentedToggle"
import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { useCreateLinkedTransactions } from "../hooks/useCreateLinkedTransactions"
import { CategorySelectorSheet } from "./CategorySelectorSheet"
import { HouseholdSelectorSheet } from "./HouseholdSelectorSheet"

import type { Category } from "../../categories/types"
import type { LinkedTransactionTarget } from "../types"

type CreateTransactionFormProps = {
  onSuccess?: () => void
}

type CreateMovementMode = "income" | "expense" | "fixed"

export function CreateTransactionForm({ onSuccess }: CreateTransactionFormProps) {
  const [type, setType] = useState<"expense" | "income">("expense")
  const [mode, setMode] = useState<CreateMovementMode>("expense")
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )
  const [targets, setTargets] = useState<LinkedTransactionTarget[]>(() =>
    selectedHouseholdId
      ? [{ householdId: selectedHouseholdId, categoryId: null }]
      : []
  )
  const [activeCategoryHouseholdId, setActiveCategoryHouseholdId] = useState<string | null>(null)
  const [selectedCategoriesByHousehold, setSelectedCategoriesByHousehold] =
    useState<Record<string, Category>>({})
  const householdSelectorRef = useRef<BottomSheetModal>(null)
  const categorySelectorRef = useRef<BottomSheetModal>(null)
  const createTransactionMutation = useCreateLinkedTransactions()
  const { data: memberships } = useHouseholds()
  const isFixedMode = mode === "fixed"
  const primaryTarget =
    targets.find((target) => target.householdId === selectedHouseholdId) ??
    targets[0]
  const additionalTargets = primaryTarget
    ? targets.filter((target) => target.householdId !== primaryTarget.householdId)
    : []

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useHouseholdCategories(
    activeCategoryHouseholdId,
    type,
    Boolean(activeCategoryHouseholdId) && !isFixedMode,
  )

  useEffect(() => {
    if (!memberships) return

    const availableHouseholdIds = new Set(
      memberships.map((membership) => membership.household_id)
    )

    setTargets((currentTargets) => {
      const validTargets = currentTargets.filter((target) =>
        availableHouseholdIds.has(target.householdId)
      )
      if (validTargets.length > 0) {
        return validTargets.length === currentTargets.length
          ? currentTargets
          : validTargets
      }

      const fallbackHouseholdId = selectedHouseholdId &&
        availableHouseholdIds.has(selectedHouseholdId)
        ? selectedHouseholdId
        : memberships[0]?.household_id

      return fallbackHouseholdId
        ? [{ householdId: fallbackHouseholdId, categoryId: null }]
        : []
    })
  }, [memberships, selectedHouseholdId])

  useEffect(() => {
    if (
      activeCategoryHouseholdId &&
      !targets.some((target) => target.householdId === activeCategoryHouseholdId)
    ) {
      setActiveCategoryHouseholdId(null)
      categorySelectorRef.current?.dismiss()
    }
  }, [activeCategoryHouseholdId, targets])

  function handleModeChange(newMode: CreateMovementMode) {
    setMode(newMode)
    setTargets((currentTargets) =>
      currentTargets.map((target) => ({ ...target, categoryId: null }))
    )
    setSelectedCategoriesByHousehold({})
    if (newMode !== "fixed") {
      setType(newMode)
    } else {
      setActiveCategoryHouseholdId(null)
    }
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

    if (targets.length === 0) {
      Alert.alert("Error", "Selecciona al menos un espacio.")
      return
    }

    if (targets.some((target) => !target.categoryId)) {
      Alert.alert("Error", "Selecciona una categoría para cada espacio.")
      return
    }

    const availableHouseholdIds = new Set(
      memberships?.map((membership) => membership.household_id) ?? []
    )
    if (targets.some((target) => !availableHouseholdIds.has(target.householdId))) {
      Alert.alert("Error", "No tienes acceso a uno de los espacios seleccionados.")
      return
    }

    try {
      await createTransactionMutation.mutateAsync({
        type,
        title: title.trim(),
        amount: parsedAmount,
        targets,
      })
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "No se pudo crear el movimiento."
      Alert.alert("Error", message)
    }
  }

  function handleHouseholdSelection(householdIds: string[]) {
    if (householdIds.length === 0) return

    setTargets((currentTargets) =>
      householdIds.map(
        (householdId) =>
          currentTargets.find((target) => target.householdId === householdId) ?? {
            householdId,
            categoryId: null,
          }
      )
    )
    setSelectedCategoriesByHousehold((currentCategories) =>
      Object.fromEntries(
        Object.entries(currentCategories).filter(([householdId]) =>
          householdIds.includes(householdId)
        )
      )
    )
  }

  function handleCategorySelect(category: Category) {
    if (!activeCategoryHouseholdId) return

    setTargets((currentTargets) =>
      currentTargets.map((target) =>
        target.householdId === activeCategoryHouseholdId
          ? { ...target, categoryId: category.id }
          : target
      )
    )
    setSelectedCategoriesByHousehold((currentCategories) => ({
      ...currentCategories,
      [activeCategoryHouseholdId]: category,
    }))
    categorySelectorRef.current?.dismiss()
  }

  function openCategorySelector(householdId: string) {
    setActiveCategoryHouseholdId(householdId)
    categorySelectorRef.current?.present()
  }

  function renderCategoryField(target: LinkedTransactionTarget) {
    const household = memberships?.find(
      (membership) => membership.household_id === target.householdId
    )?.household
    const category = selectedCategoriesByHousehold[target.householdId]

    return (
      <Pressable
        key={target.householdId}
        accessibilityRole="button"
        onPress={() => openCategorySelector(target.householdId)}
        style={[styles.field, styles.darkField]}
      >
        <Text style={styles.fieldLabel}>
          Categoría {household?.name ?? target.householdId}
        </Text>
        <View style={styles.fieldValueGroup}>
          {category ? (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.fieldValue}
            >
              {category.name}
            </Text>
          ) : null}
          <FieldChevronIcon />
        </View>
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      <SegmentedToggle
        value={mode}
        options={[
          { value: "income", label: "Ingreso" },
          { value: "expense", label: "Gasto" },
          { value: "fixed", label: "Gasto Fijo" },
        ]}
        onChange={handleModeChange}
        width="100%"
      />

      <View style={styles.fieldsStack}>
      <TextInput
        style={[styles.field, styles.input]}
        placeholder="Título"
        placeholderTextColor="rgba(28, 28, 28, 0.5)"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.field, styles.input]}
        placeholder="Monto"
        placeholderTextColor="rgba(28, 28, 28, 0.5)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      {!isFixedMode ? (
        <>
          {primaryTarget ? renderCategoryField(primaryTarget) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => householdSelectorRef.current?.present()}
            style={[styles.field, styles.darkField]}
          >
            <Text style={styles.fieldLabel}>Añadir a Espacio</Text>
            <View style={styles.fieldValueGroup}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.fieldValue}
              >
                {targets
                  .map(
                    (target) =>
                      memberships?.find(
                        (membership) => membership.household_id === target.householdId
                      )?.household.name ?? target.householdId
                  )
                  .join(", ")}
              </Text>
              <FieldChevronIcon />
            </View>
          </Pressable>

          <View style={styles.targetsSection}>
            {additionalTargets.map(renderCategoryField)}
          </View>
        </>
      ) : null}

      {!isFixedMode ? (
        <View style={styles.categorySection}>
          <HouseholdSelectorSheet
            ref={householdSelectorRef}
            memberships={memberships ?? []}
            selectedHouseholdIds={targets.map((target) => target.householdId)}
            onChange={handleHouseholdSelection}
            onDone={() => householdSelectorRef.current?.dismiss()}
          />
          <CategorySelectorSheet
            ref={categorySelectorRef}
            householdName={
              memberships?.find(
                (membership) => membership.household_id === activeCategoryHouseholdId
              )?.household.name ?? ""
            }
            categories={categories}
            selectedCategoryId={
              targets.find((target) => target.householdId === activeCategoryHouseholdId)
                ?.categoryId ?? null
            }
            isLoading={categoriesLoading}
            hasError={categoriesError}
            onSelect={handleCategorySelect}
          />
        </View>
      ) : null}

      <Pressable
        style={[styles.button, (createTransactionMutation.isPending || isFixedMode) && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={createTransactionMutation.isPending || isFixedMode}
      >
        <Text style={styles.buttonText}>
          {createTransactionMutation.isPending ? "Guardando..." : "Guardar movimiento"}
        </Text>
      </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  fieldsStack: { gap: 11, marginTop: 40 },
  targetsSection: { gap: 11 },
  field: {
    width: "100%",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  input: {
    backgroundColor: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
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
    opacity: 0.5,
    textAlign: "right",
  },
  categorySection: { gap: 10 },
  helperText: { color: "#777" },
  errorText: { color: "#b42318" },
  button: {
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 999,
    padding: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
})
