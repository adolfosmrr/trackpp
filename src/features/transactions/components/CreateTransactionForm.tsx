import { useEffect, useRef, useState } from "react"
import {
  Alert,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button } from "../../../components/buttons/Button"
import { FieldRow, TextField, fieldStyles } from "../../../components/inputs/TextField"
import { AppText } from "../../../components/text/AppText"
import { colors, fonts, layout } from "../../../theme"
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
import type { AppStackParamList } from "../../../navigation/types"

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

type SelectedCategoryDisplay = {
  id: string
  name: string
  icon: string | null
}

type CreateTransactionFormProps = {
  navigation: NativeStackScreenProps<AppStackParamList, "CreateMovement">["navigation"]
  route: NativeStackScreenProps<AppStackParamList, "CreateMovement">["route"]
  request: TransactionSheetRequest
}

export function CreateTransactionForm({
  navigation,
  request,
  route,
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
  const [selectedCategoriesByHousehold, setSelectedCategoriesByHousehold] =
    useState<Record<string, SelectedCategoryDisplay>>({})
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
  const { data: fixedCategories } = useHouseholdCategories(
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

  useEffect(() => {
    const selection = route.params?.categorySelection
    if (!selection) return

    if (mode === "fixed") {
      if (selection.householdId === fixedCategoryHouseholdId) {
        setFixedCategoryId(selection.categoryId)
        if (fixedCategoryHouseholdId) {
          void setLastCategoryId(fixedCategoryHouseholdId, "fixed", selection.categoryId)
        }
      }
    } else {
      setTargets((currentTargets) =>
        currentTargets.map((target) =>
          target.householdId === selection.householdId
            ? { ...target, categoryId: selection.categoryId }
            : target
        )
      )
      setSelectedCategoriesByHousehold((currentCategories) => ({
        ...currentCategories,
        [selection.householdId]: {
          id: selection.categoryId,
          name: selection.name,
          icon: selection.icon,
        },
      }))
      void setLastCategoryId(selection.householdId, type, selection.categoryId)
    }

    navigation.setParams({ categorySelection: undefined })
  }, [
    fixedCategoryHouseholdId,
    mode,
    navigation,
    route.params?.categorySelection,
    type,
  ])

  useEffect(() => {
    const selection = route.params?.householdSelection
    if (!selection) return
    if (selection.householdIds.length > 0) {
      setTargets((currentTargets) =>
        selection.householdIds.map(
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
            selection.householdIds.includes(householdId)
          )
        )
      )
    }
    navigation.setParams({ householdSelection: undefined })
  }, [navigation, route.params?.householdSelection])

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
        navigation.goBack()
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
      navigation.goBack()
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "No se pudo crear el movimiento."
      Alert.alert("Error", message)
    }
  }

  function openCategorySelector(householdId: string) {
    const householdName = memberships?.find(
      (membership) => membership.household_id === householdId,
    )?.household.name ?? ""
    navigation.navigate("CategoryPicker", {
      returnTo: "CreateMovement",
      householdId,
      householdName,
      entryType: type,
      selectedCategoryId: targets.find((target) => target.householdId === householdId)?.categoryId ?? null,
    })
  }

  function openFixedCategorySelector() {
    if (!fixedCategoryHouseholdId) return
    const householdName = memberships?.find(
      (membership) => membership.household_id === fixedCategoryHouseholdId,
    )?.household.name ?? ""
    navigation.navigate("CategoryPicker", {
      returnTo: "CreateMovement",
      householdId: fixedCategoryHouseholdId,
      householdName,
      entryType: "expense",
      selectedCategoryId: fixedCategoryId,
    })
  }

  function openHouseholdSelector() {
    navigation.navigate("HouseholdPicker", {
      returnTo: "CreateMovement",
      selectedHouseholdIds: targets.map((target) => target.householdId),
      selectionMode: "multiple",
      title: "Añadir a",
    })
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
        <AppText style={styles.fieldLabel} variant="subtitle">
          Categoría {household?.name ?? target.householdId}
        </AppText>
        <View style={styles.fieldValueGroup}>
          {category ? (
            <AppText
              ellipsizeMode="tail"
              numberOfLines={1}
              style={styles.fieldValue}
              tone="muted"
              variant="subtitle"
            >
              {category.name}
            </AppText>
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
        <AppText style={styles.fieldLabel} variant="subtitle">Categoría</AppText>
        <View style={styles.fieldValueGroup}>
          <AppText
            ellipsizeMode="tail"
            numberOfLines={1}
            style={styles.fieldValue}
            tone="muted"
            variant="subtitle"
          >
            {selectedFixedCategory?.name ?? "Seleccionar categoría"}
          </AppText>
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
      <TextField
        accessibilityLabel="Monto"
        autoFocus={!isEditingFixedExpense}
        placeholder="Monto"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <TextField
        accessibilityLabel="Título"
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />

      {isFixedMode ? (
        <>
          {renderFixedCategoryField()}
          <View style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}>
            <AppText tone="muted" variant="subtitle">Día de cobro</AppText>
            <TextInput
              style={styles.dayInput}
              keyboardType="number-pad"
              maxLength={2}
              value={chargeDay}
              onChangeText={setChargeDay}
            />
          </View>
          <View style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}>
            <AppText tone="muted" variant="subtitle">Día de vencimiento</AppText>
            <TextInput
              style={styles.dayInput}
              keyboardType="number-pad"
              maxLength={2}
              value={dueDay}
              onChangeText={setDueDay}
            />
          </View>
          <View style={styles.optionBlock}>
            <AppText variant="sectionTitle">Frecuencia</AppText>
            <OptionChips
              accessibilityLabel="Frecuencia del gasto fijo"
              onChange={setFrequency}
              options={FIXED_EXPENSE_FREQUENCIES}
              value={frequency}
            />
          </View>
          <View style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}>
            <AppText tone="muted" variant="subtitle">Débito automático</AppText>
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
              <AppText variant="sectionTitle">Tarjeta</AppText>
              <OptionChips
                accessibilityLabel="Tarjeta del débito automático"
                onChange={setAutoDebitSource}
                options={AUTO_DEBIT_SOURCES}
                value={autoDebitSource}
              />
            </View>
          ) : null}
          {isEditingFixedExpense ? (
            <AppText tone="muted" variant="caption">
              Si cambiás el monto, el nuevo rige desde este período. Los anteriores quedan igual.
            </AppText>
          ) : null}
        </>
      ) : (
        <>
          {primaryTarget ? renderCategoryField(primaryTarget) : null}

          <FieldRow
            onPress={openHouseholdSelector}
          >
            <AppText style={styles.fieldLabel} variant="subtitle">Añadir a Espacio</AppText>
            <View style={styles.fieldValueGroup}>
              <AppText
                ellipsizeMode="tail"
                numberOfLines={1}
                style={styles.fieldValue}
                tone="muted"
                variant="subtitle"
              >
                {targets
                  .map(
                    (target) =>
                      memberships?.find(
                        (membership) => membership.household_id === target.householdId
                      )?.household.name ?? target.householdId
                  )
                  .join(", ")}
              </AppText>
              <FieldChevronIcon />
            </View>
          </FieldRow>

          <View style={styles.targetsSection}>
            {additionalTargets.map(renderCategoryField)}
          </View>
        </>
      )}

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
  container: {},
  fieldsStack: { gap: layout.titleContentGap },
  targetsSection: { gap: layout.titleContentGap },
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
    flex: 1,
    flexShrink: 1,
    textAlign: "right",
  },
  optionBlock: { gap: layout.titleContentGap },
})
