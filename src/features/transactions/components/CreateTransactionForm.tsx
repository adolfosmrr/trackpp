import { useEffect, useRef, useState } from "react"
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native"
import { Button } from "../../../components/buttons/Button"
import { FieldRow, fieldStyles } from "../../../components/inputs/TextField"
import { colors, fonts } from "../../../theme"
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
import { OptionChips } from "../../fixedExpenses/components/OptionChips"
import { useCreateFixedExpense } from "../../fixedExpenses/hooks/useCreateFixedExpense"
import { useUpdateFixedExpense } from "../../fixedExpenses/hooks/useUpdateFixedExpense"
import {
  AUTO_DEBIT_SOURCES,
  FIXED_EXPENSE_FREQUENCIES,
  type AutoDebitSource,
  type FixedExpenseFrequency,
} from "../../fixedExpenses/utils/frequency"
import {
  getLastCategoryId,
  setLastCategoryId,
  setLastEntryMode,
} from "../services/entryPreferences"
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
  const editingFixedExpense = request.kind === "edit-fixed"
    ? request.fixedExpense
    : undefined
  const initialMode = request.kind === "edit-fixed"
    ? "fixed"
    : request.initialMode
  const [type, setType] = useState<"expense" | "income">(
    initialMode === "income" ? "income" : "expense"
  )
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
  const [frequency, setFrequency] = useState<FixedExpenseFrequency>(
    editingFixedExpense?.frequency ?? "monthly"
  )
  const [autoDebit, setAutoDebit] = useState(editingFixedExpense?.auto_debit ?? false)
  const [autoDebitSource, setAutoDebitSource] = useState<AutoDebitSource | null>(
    editingFixedExpense?.auto_debit_source ?? null
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

  const suggestionHouseholdId = isFixedMode
    ? fixedCategoryHouseholdId
    : primaryTarget?.householdId ?? null
  const { data: suggestionCategories } = useHouseholdCategories(
    suggestionHouseholdId,
    isFixedMode ? "expense" : type,
    Boolean(suggestionHouseholdId) && !isEditingFixedExpense,
  )
  const appliedSuggestion = useRef<string | null>(null)
  const suggestionKey = `${mode}:${suggestionHouseholdId ?? ""}`

  useEffect(() => {
    if (isEditingFixedExpense || !suggestionHouseholdId || !suggestionCategories) return
    if (appliedSuggestion.current === suggestionKey) return

    let cancelled = false
    void getLastCategoryId(suggestionHouseholdId, mode).then((categoryId) => {
      if (cancelled) return
      appliedSuggestion.current = suggestionKey
      if (!categoryId) return
      const category = suggestionCategories.find((item) => item.id === categoryId)
      if (!category) return

      if (mode === "fixed") {
        setFixedCategoryId((current) => current ?? category.id)
        return
      }

      setTargets((currentTargets) =>
        currentTargets.map((target) =>
          target.householdId === suggestionHouseholdId && !target.categoryId
            ? { ...target, categoryId: category.id }
            : target
        )
      )
      setSelectedCategoriesByHousehold((current) => {
        if (current[suggestionHouseholdId]) return current
        return { ...current, [suggestionHouseholdId]: category }
      })
    })

    return () => {
      cancelled = true
    }
  }, [
    isEditingFixedExpense,
    mode,
    suggestionCategories,
    suggestionHouseholdId,
    suggestionKey,
  ])

  function handleModeChange(newMode: CreateMovementMode) {
    setMode(newMode)
    void setLastEntryMode(newMode)
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

      if (autoDebit && !autoDebitSource) {
        Alert.alert("Error", "Elegí la tarjeta del débito automático.")
        return
      }

      const fixedSchedule = {
        frequency,
        autoDebit,
        autoDebitSource: autoDebit ? autoDebitSource : null,
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
            ...fixedSchedule,
          })
        } else {
          await createFixedExpenseMutation.mutateAsync({
            name: title.trim(),
            amount: parsedAmount,
            categoryId: fixedCategoryId,
            chargeDay: parsedChargeDay,
            dueDay: parsedDueDay,
            isActive: true,
            ...fixedSchedule,
          })
        }
        if (fixedCategoryHouseholdId) {
          await setLastCategoryId(fixedCategoryHouseholdId, "fixed", fixedCategoryId)
        }
        await setLastEntryMode("fixed")
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
      await Promise.all(
        targets
          .filter((target) => target.categoryId)
          .map((target) => setLastCategoryId(target.householdId, type, target.categoryId!))
      )
      await setLastEntryMode(type)
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
      if (fixedCategoryHouseholdId) {
        void setLastCategoryId(fixedCategoryHouseholdId, "fixed", category.id)
      }
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
    void setLastCategoryId(activeCategoryHouseholdId, type, category.id)
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
      <FieldRow
        key={target.householdId}
        onPress={() => openCategorySelector(target.householdId)}
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
      </FieldRow>
    )
  }

  function renderFixedCategoryField() {
    return (
      <FieldRow
        onPress={openFixedCategorySelector}
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
      </FieldRow>
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
        accessibilityLabel="Monto"
        autoFocus={!isEditingFixedExpense}
        style={[fieldStyles.surface, fieldStyles.text, fieldStyles.pill]}
        placeholder="Monto"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <BottomSheetTextInput
        accessibilityLabel="Título"
        style={[fieldStyles.surface, fieldStyles.text, fieldStyles.pill]}
        placeholder="Título"
        placeholderTextColor={colors.mutedForeground}
        value={title}
        onChangeText={setTitle}
      />

      {isFixedMode ? (
        <>
          {renderFixedCategoryField()}
          <View style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}>
            <Text style={styles.dayFieldLabel}>Día de cobro</Text>
            <BottomSheetTextInput
              style={styles.dayInput}
              keyboardType="number-pad"
              maxLength={2}
              value={chargeDay}
              onChangeText={setChargeDay}
            />
          </View>
          <View style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}>
            <Text style={styles.dayFieldLabel}>Día de vencimiento</Text>
            <BottomSheetTextInput
              style={styles.dayInput}
              keyboardType="number-pad"
              maxLength={2}
              value={dueDay}
              onChangeText={setDueDay}
            />
          </View>
          <View style={styles.optionBlock}>
            <Text style={styles.fieldLabel}>Frecuencia</Text>
            <OptionChips
              accessibilityLabel="Frecuencia del gasto fijo"
              onChange={setFrequency}
              options={FIXED_EXPENSE_FREQUENCIES}
              value={frequency}
            />
          </View>
          <View style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}>
            <Text style={styles.dayFieldLabel}>Débito automático</Text>
            <Switch
              accessibilityLabel="Débito automático"
              onValueChange={(enabled) => {
                setAutoDebit(enabled)
                if (!enabled) setAutoDebitSource(null)
              }}
              thumbColor={colors.foreground}
              trackColor={{ false: colors.control, true: colors.brand }}
              value={autoDebit}
            />
          </View>
          {autoDebit ? (
            <View style={styles.optionBlock}>
              <Text style={styles.fieldLabel}>Tarjeta</Text>
              <OptionChips
                accessibilityLabel="Tarjeta del débito automático"
                onChange={setAutoDebitSource}
                options={AUTO_DEBIT_SOURCES}
                value={autoDebitSource}
              />
            </View>
          ) : null}
          {isEditingFixedExpense ? (
            <Text style={styles.helperText}>
              Si cambiás el monto, el nuevo rige desde este período. Los anteriores quedan igual.
            </Text>
          ) : null}
        </>
      ) : (
        <>
          {primaryTarget ? renderCategoryField(primaryTarget) : null}

          <FieldRow
            onPress={() => householdSelectorRef.current?.present()}
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
          </FieldRow>

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

      <Button
        disabled={isEditingFixedExpense
          ? updateFixedExpenseMutation.isPending
          : createTransactionMutation.isPending || createFixedExpenseMutation.isPending}
        label={(
          isEditingFixedExpense
            ? updateFixedExpenseMutation.isPending
            : createTransactionMutation.isPending || createFixedExpenseMutation.isPending
        )
          ? "Guardando..."
          : isEditingFixedExpense
            ? "Guardar cambios"
            : "Guardar movimiento"}
        onPress={handleSubmit}
        tone="brand"
      />
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
  dayFieldLabel: {
    color: colors.mutedForeground,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 16,
  },
  dayInput: {
    color: colors.foreground,
    fontFamily: fonts.monoMedium,
    fontSize: 16,
    lineHeight: 16,
    minWidth: 32,
    padding: 0,
    textAlign: "right",
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
  optionBlock: { gap: 8 },
  categorySection: { gap: 10 },
  helperText: { color: colors.mutedForeground, fontFamily: fonts.sans },
  errorText: { color: colors.destructive, fontFamily: fonts.sans },
})
