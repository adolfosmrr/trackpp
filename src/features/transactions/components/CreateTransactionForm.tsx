import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import {
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { runOnJS, useSharedValue } from "react-native-reanimated"

import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"
import { useHouseholdCategories } from "../../categories/hooks/useHouseholdCategories"
import { SegmentedToggle } from "../../../components/inputs/SegmentedToggle"
import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { useCreateLinkedTransactions } from "../hooks/useCreateLinkedTransactions"
import { useCreateFixedExpense } from "../../fixedExpenses/hooks/useCreateFixedExpense"
import { useUpdateFixedExpense } from "../../fixedExpenses/hooks/useUpdateFixedExpense"
import { CategorySelectorSheet } from "./CategorySelectorSheet"
import { HouseholdSelectorSheet } from "./HouseholdSelectorSheet"

import type { Category } from "../../categories/types"
import type {
  CreateMovementMode,
  LinkedTransactionTarget,
  TransactionSheetRequest,
} from "../types"

const MODE_ORDER: CreateMovementMode[] = ["expense", "income", "fixed"]
const MODE_GESTURE_ACTIVATION_DISTANCE = 36
const MODE_SWIPE_DISTANCE = 70
const MODE_SWIPE_VELOCITY = 650
const MODE_HORIZONTAL_INTENT_RATIO = 1.3
const MODE_VERTICAL_FAIL_DISTANCE = 26

type CreateTransactionFormProps = {
  onSuccess?: () => void
  request: TransactionSheetRequest
}

export function CreateTransactionForm({
  onSuccess,
  request,
}: CreateTransactionFormProps) {
  const [type, setType] = useState<"expense" | "income">("expense")
  const editingFixedExpense = request.kind === "edit-fixed"
    ? request.fixedExpense
    : undefined
  const initialMode = request.kind === "edit-fixed"
    ? "fixed"
    : request.initialMode
  const [mode, setMode] = useState<CreateMovementMode>(initialMode)
  const modeGestureCommitted = useSharedValue(false)
  const [title, setTitle] = useState(editingFixedExpense?.name ?? "")
  const [amount, setAmount] = useState(
    editingFixedExpense ? String(editingFixedExpense.amount) : ""
  )
  const [fixedCategoryId, setFixedCategoryId] = useState<string | null>(
    editingFixedExpense?.category_id ?? null
  )
  const [chargeDay, setChargeDay] = useState(
    editingFixedExpense ? String(editingFixedExpense.charge_day) : "1"
  )
  const [dueDay, setDueDay] = useState(
    editingFixedExpense ? String(editingFixedExpense.due_day) : "10"
  )
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
  const createFixedExpenseMutation = useCreateFixedExpense()
  const updateFixedExpenseMutation = useUpdateFixedExpense()
  const { data: memberships } = useHouseholds()
  const isEditingFixedExpense = Boolean(editingFixedExpense)
  const isFixedMode = mode === "fixed"
  const fixedCategoryHouseholdId = editingFixedExpense?.household_id ?? selectedHouseholdId
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
  const {
    data: fixedCategories,
    isLoading: fixedCategoriesLoading,
    isError: fixedCategoriesError,
  } = useHouseholdCategories(
    fixedCategoryHouseholdId,
    "expense",
    isFixedMode,
  )
  const selectedFixedCategory = fixedCategories?.find(
    (category) => category.id === fixedCategoryId
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
      !isEditingFixedExpense &&
      activeCategoryHouseholdId &&
      !targets.some((target) => target.householdId === activeCategoryHouseholdId)
    ) {
      setActiveCategoryHouseholdId(null)
      categorySelectorRef.current?.dismiss()
    }
  }, [activeCategoryHouseholdId, isEditingFixedExpense, targets])

  function handleModeChange(newMode: CreateMovementMode) {
    setMode(newMode)
    setTargets((currentTargets) =>
      currentTargets.map((target) => ({ ...target, categoryId: null }))
    )
    setSelectedCategoriesByHousehold({})
    setFixedCategoryId(null)
    if (newMode !== "fixed") {
      setType(newMode)
    } else {
      setActiveCategoryHouseholdId(null)
    }
  }

  function handleModeSwipe(
    translationX: number,
    translationY: number,
    velocityX: number,
  ) {
    if (modeGestureCommitted.value) return

    const horizontalDistance = Math.abs(translationX)
    const verticalDistance = Math.abs(translationY)
    const isClearlyHorizontal =
      horizontalDistance >= verticalDistance * MODE_HORIZONTAL_INTENT_RATIO
    const hasEnoughIntent =
      horizontalDistance >= MODE_SWIPE_DISTANCE ||
      Math.abs(velocityX) >= MODE_SWIPE_VELOCITY

    if (!isClearlyHorizontal || !hasEnoughIntent) return

    const currentIndex = MODE_ORDER.indexOf(mode)
    const nextIndex = translationX < 0 ? currentIndex + 1 : currentIndex - 1
    const nextMode = MODE_ORDER[nextIndex]

    if (!nextMode) return

    modeGestureCommitted.value = true
    handleModeChange(nextMode)
  }

  const nativeGesture = Gesture.Native().shouldCancelWhenOutside(false)
  const modeGesture = Gesture.Pan()
    .simultaneousWithExternalGesture(nativeGesture)
    .enabled(!isEditingFixedExpense)
    .activeOffsetX([
      -MODE_GESTURE_ACTIVATION_DISTANCE,
      MODE_GESTURE_ACTIVATION_DISTANCE,
    ])
    .failOffsetY([
      -MODE_VERTICAL_FAIL_DISTANCE,
      MODE_VERTICAL_FAIL_DISTANCE,
    ])
    .onBegin(() => {
      modeGestureCommitted.value = false
    })
    .onEnd((event) => {
      runOnJS(handleModeSwipe)(
        event.translationX,
        event.translationY,
        event.velocityX,
      )
    })

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Error", "Escribe un título.")
      return
    }

    const parsedAmount = Number(amount.replace(",", "."))
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Error", "Escribe un monto válido.")
      return
    }

    if (isFixedMode) {
      if (title.trim().length < 1 || title.trim().length > 100) {
        Alert.alert("Error", "El nombre debe tener entre 1 y 100 caracteres.")
        return
      }

      if (!fixedCategoryId) {
        Alert.alert("Error", "Selecciona una categoría.")
        return
      }

      const parsedChargeDay = Number(chargeDay)
      const parsedDueDay = Number(dueDay)
      if (!isValidDay(parsedChargeDay) || !isValidDay(parsedDueDay)) {
        Alert.alert("Error", "Los días deben estar entre 1 y 31.")
        return
      }

      try {
        if (isEditingFixedExpense && editingFixedExpense) {
          if (request.kind !== "edit-fixed") {
            throw new Error("Falta el período del gasto fijo que se está editando.")
          }

          await updateFixedExpenseMutation.mutateAsync({
            fixedExpenseId: editingFixedExpense.id,
            period: request.period,
            name: title.trim(),
            amount: parsedAmount,
            categoryId: fixedCategoryId,
            chargeDay: parsedChargeDay,
            dueDay: parsedDueDay,
            isActive: editingFixedExpense.is_active,
          })
        } else {
          await createFixedExpenseMutation.mutateAsync({
            name: title.trim(),
            amount: parsedAmount,
            categoryId: fixedCategoryId,
            chargeDay: parsedChargeDay,
            dueDay: parsedDueDay,
            isActive: true,
          })
        }
        onSuccess?.()
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : isEditingFixedExpense
            ? "No se pudo actualizar el gasto fijo."
            : "No se pudo crear el gasto fijo."
        Alert.alert("Error", message)
      }
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

    if (isFixedMode) {
      setFixedCategoryId(category.id)
      categorySelectorRef.current?.dismiss()
      return
    }

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

  function openFixedCategorySelector() {
    if (!fixedCategoryHouseholdId) return
    setActiveCategoryHouseholdId(fixedCategoryHouseholdId)
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

  function renderFixedCategoryField() {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={openFixedCategorySelector}
        style={[styles.field, styles.darkField]}
      >
        <Text style={styles.fieldLabel}>Categoría</Text>
        <View style={styles.fieldValueGroup}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.fieldValue}
          >
            {selectedFixedCategory?.name ?? "Seleccionar categoría"}
          </Text>
          <FieldChevronIcon />
        </View>
      </Pressable>
    )
  }

  return (
    <GestureDetector gesture={Gesture.Simultaneous(modeGesture, nativeGesture)}>
      <View style={styles.container}>
          {!isEditingFixedExpense ? (
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
          ) : null}

      <View style={styles.fieldsStack}>
      <BottomSheetTextInput
        style={[styles.field, styles.input]}
        placeholder="Título"
        placeholderTextColor="rgba(28, 28, 28, 0.5)"
        value={title}
        onChangeText={setTitle}
      />
      <BottomSheetTextInput
        style={[styles.field, styles.input]}
        placeholder="Monto"
        placeholderTextColor="rgba(28, 28, 28, 0.5)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      {isFixedMode ? (
        <>
          {renderFixedCategoryField()}
          <View style={[styles.field, styles.dayField]}>
            <Text style={styles.dayFieldLabel}>Día de cobro</Text>
            <BottomSheetTextInput
              style={styles.dayInput}
              keyboardType="number-pad"
              maxLength={2}
              value={chargeDay}
              onChangeText={setChargeDay}
            />
          </View>
          <View style={[styles.field, styles.dayField]}>
            <Text style={styles.dayFieldLabel}>Día de vencimiento</Text>
            <BottomSheetTextInput
              style={styles.dayInput}
              keyboardType="number-pad"
              maxLength={2}
              value={dueDay}
              onChangeText={setDueDay}
            />
          </View>
        </>
      ) : (
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
      )}

      <View style={styles.categorySection}>
        {!isFixedMode ? (
          <HouseholdSelectorSheet
            ref={householdSelectorRef}
            memberships={memberships ?? []}
            selectedHouseholdIds={targets.map((target) => target.householdId)}
            onChange={handleHouseholdSelection}
            onDone={() => householdSelectorRef.current?.dismiss()}
          />
        ) : null}
        <CategorySelectorSheet
          ref={categorySelectorRef}
          householdName={
            memberships?.find(
              (membership) => membership.household_id === activeCategoryHouseholdId
            )?.household.name ?? ""
          }
          categories={isFixedMode ? fixedCategories : categories}
          selectedCategoryId={
            isFixedMode
              ? fixedCategoryId
              : targets.find((target) => target.householdId === activeCategoryHouseholdId)
                ?.categoryId ?? null
          }
          isLoading={isFixedMode ? fixedCategoriesLoading : categoriesLoading}
          hasError={isFixedMode ? fixedCategoriesError : categoriesError}
          onSelect={handleCategorySelect}
        />
      </View>

      <Pressable
        style={[styles.button, (
          isEditingFixedExpense
            ? updateFixedExpenseMutation.isPending
            : createTransactionMutation.isPending || createFixedExpenseMutation.isPending
        ) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isEditingFixedExpense
          ? updateFixedExpenseMutation.isPending
          : createTransactionMutation.isPending || createFixedExpenseMutation.isPending}
      >
        <Text style={styles.buttonText}>
          {(
            isEditingFixedExpense
              ? updateFixedExpenseMutation.isPending
              : createTransactionMutation.isPending || createFixedExpenseMutation.isPending
          )
            ? "Guardando..."
            : isEditingFixedExpense
              ? "Guardar cambios"
              : "Guardar movimiento"}
        </Text>
      </Pressable>
      </View>
      </View>
    </GestureDetector>
  )
}

function isValidDay(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 31
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
    fontSize: 16,
    lineHeight: 16,
  },
  dayField: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayFieldLabel: {
    color: "rgba(28,28,28,0.5)",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
  },
  dayInput: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
    minWidth: 32,
    padding: 0,
    textAlign: "right",
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
