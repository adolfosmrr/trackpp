import { useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Button } from "../../../components/buttons/Button"
import { TextField, fieldStyles } from "../../../components/inputs/TextField"
import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { NativeMenu } from "../../../components/menus/NativeMenu"
import { AppText } from "../../../components/text/AppText"
import type { AppStackParamList } from "../../../navigation/types"
import { colors, fonts, layout, radii } from "../../../theme"
import { currencyCode, formatMoney } from "../../../utils/formatMoney"
import { parseLocalDate, toLocalDateString } from "../../../utils/localDate"
import { useHouseholdCategories } from "../../categories/hooks/useHouseholdCategories"
import type { Category } from "../../categories/types"
import { sharedSpaceCurrency } from "../../households/data/currencies"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { setLastCategoryId, setLastEntryMode } from "../services/entryPreferences"
import { formatTransactionDate } from "../utils/transactionFilters"
import { useCreateLinkedTransactions } from "../hooks/useCreateLinkedTransactions"
import type { LinkedTransactionTarget, ScreenshotMovement } from "../types"

type ImportMovementsScreenProps = NativeStackScreenProps<AppStackParamList, "ImportMovements">

type DraftMovement = {
  key: string
  title: string
  amount: string
  date: string
  time: string | null
  currency: string
  categoryId: string | null
}

type ReadyMovement = {
  key: string
  title: string
  amount: number
  date: string
  time: string | null
  categoryId: string
}

export function ImportMovementsScreen({ navigation, route }: ImportMovementsScreenProps) {
  const { duplicates, entryType, householdId, items, targets } = route.params
  const householdsQuery = useHouseholds()
  const categoriesQuery = useHouseholdCategories(householdId, entryType)
  const memberships = householdsQuery.data
  const createTransactionMutation = useCreateLinkedTransactions()
  const [drafts, setDrafts] = useState<DraftMovement[] | null>(null)
  const [openDateKey, setOpenDateKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const saveLock = useRef(false)
  const seeded = useRef(false)
  const alive = useRef(true)
  const currency = sharedSpaceCurrency(targets, memberships)
  const insertable = useMemo(
    () => currency
      ? items.filter((item) => item.type === entryType && currencyCode(item.currency) === currency)
      : [],
    [currency, entryType, items],
  )
  const heldBack = useMemo(
    () => items.filter((item) => !insertable.includes(item)),
    [insertable, items],
  )

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (!currency || seeded.current) return
    seeded.current = true
    const fallbackCategoryId = targets.find((target) => target.householdId === householdId)?.categoryId ?? null
    setDrafts(insertable.map((item, index) => toDraft(item, index, fallbackCategoryId)))
  }, [currency, householdId, insertable, targets])

  useEffect(() => {
    const categories = categoriesQuery.data
    if (!categories) return
    setDrafts((current) => {
      if (!current) return current
      let changed = false
      const next = current.map((draft) => {
        if (!draft.categoryId) return draft
        const match = categories.find((category) =>
          category.id.toLowerCase() === draft.categoryId?.toLowerCase(),
        )
        if (!match) {
          changed = true
          return { ...draft, categoryId: null }
        }
        if (match.id === draft.categoryId) return draft
        changed = true
        return { ...draft, categoryId: match.id }
      })
      return changed ? next : current
    })
  }, [categoriesQuery.data])

  function updateDraft(key: string, patch: Partial<Pick<DraftMovement, "title" | "amount" | "date" | "categoryId">>) {
    setDrafts((current) => current?.map((draft) => (
      draft.key === key ? { ...draft, ...patch } : draft
    )) ?? current)
  }

  function removeDraft(key: string) {
    setOpenDateKey((current) => (current === key ? null : current))
    setDrafts((current) => current?.filter((draft) => draft.key !== key) ?? current)
  }

  async function handleConfirm() {
    if (saveLock.current || !drafts || drafts.length === 0) return
    const ready: ReadyMovement[] = []
    const categoryIds = categoriesQuery.data
      ? new Set(categoriesQuery.data.map((category) => category.id))
      : null
    for (const draft of drafts) {
      const next = prepareDraft(draft, categoryIds)
      if ("error" in next) {
        Alert.alert("Error", next.error)
        return
      }
      ready.push(next.movement)
    }

    saveLock.current = true
    setSaving(true)
    let saved = 0
    try {
      for (const item of ready) {
        if (!alive.current) return
        try {
          await createTransactionMutation.mutateAsync({
            type: entryType,
            title: item.title,
            amount: item.amount,
            transactionDate: item.date,
            transactionTime: item.time,
            targets: targetsForItem(targets, householdId, item.categoryId),
          })
          saved += 1
          if (alive.current) {
            setDrafts((current) => current?.filter((draft) => draft.key !== item.key) ?? current)
          }
        } catch {
          if (alive.current) Alert.alert("Error", partialSaveMessage(saved))
          return
        }
      }

      const lastCategoryId = ready[ready.length - 1]?.categoryId
      await Promise.all(
        targets.map((target) => {
          const categoryId = target.householdId === householdId ? lastCategoryId : target.categoryId
          return categoryId
            ? setLastCategoryId(target.householdId, entryType, categoryId)
            : Promise.resolve()
        }),
      )
      await setLastEntryMode(entryType)
      if (alive.current) navigation.popToTop()
    } finally {
      saveLock.current = false
      if (alive.current) setSaving(false)
    }
  }

  const pending = drafts ?? []

  return (
    <SheetScaffold
      footer={memberships && pending.length > 0 ? (
        <Button
          disabled={saving}
          label={saving ? "Guardando..." : "Aceptar"}
          onPress={() => {
            void handleConfirm()
          }}
          tone="brand"
        />
      ) : undefined}
      onClose={() => navigation.goBack()}
      title="Revisar capturas"
    >
      {householdsQuery.isLoading || (currency && drafts === null) ? (
        <ActivityIndicator color={colors.brand} />
      ) : householdsQuery.isError ? (
        <AppText variant="body">No se pudieron cargar tus espacios.</AppText>
      ) : !currency ? (
        <AppText variant="body">Elige espacios que usen la misma moneda.</AppText>
      ) : (
        <>
          {pending.length === 0 ? (
            <AppText variant="body">No hay movimientos nuevos.</AppText>
          ) : (
            <View style={styles.group}>
              <AppText variant="sectionTitle">
                {pending.length === 1 ? "Para cargar" : `Para cargar · ${pending.length}`}
              </AppText>
              {pending.map((draft) => (
                <EditableMovement
                  categories={categoriesQuery.data}
                  categoriesError={categoriesQuery.isError && !categoriesQuery.data}
                  categoriesLoading={categoriesQuery.isLoading && !categoriesQuery.data}
                  draft={draft}
                  entryType={entryType}
                  key={draft.key}
                  onChange={(patch) => updateDraft(draft.key, patch)}
                  onRemove={() => removeDraft(draft.key)}
                  openDate={openDateKey === draft.key}
                  onOpenDate={() => setOpenDateKey(draft.key)}
                  onCloseDate={() => setOpenDateKey((current) => (current === draft.key ? null : current))}
                />
              ))}
            </View>
          )}

          {duplicates.length > 0 ? (
            <MovementGroup
              movements={duplicates}
              reason="Ya estaba cargado y queda afuera."
              title="Ya cargados"
            />
          ) : null}

          {heldBack.length > 0 ? (
            <MovementGroup
              movements={heldBack}
              reasonFor={(movement) => heldBackReason(movement, entryType)}
              title="No se cargan"
            />
          ) : null}
        </>
      )}
    </SheetScaffold>
  )
}

function EditableMovement({
  categories,
  categoriesError,
  categoriesLoading,
  draft,
  entryType,
  onChange,
  onCloseDate,
  onOpenDate,
  onRemove,
  openDate,
}: {
  categories: Category[] | undefined
  categoriesError: boolean
  categoriesLoading: boolean
  draft: DraftMovement
  entryType: "expense" | "income"
  onChange: (patch: Partial<Pick<DraftMovement, "title" | "amount" | "date" | "categoryId">>) => void
  onCloseDate: () => void
  onOpenDate: () => void
  onRemove: () => void
  openDate: boolean
}) {
  const selected = categories?.find((category) => category.id === draft.categoryId) ?? null
  const date = parseLocalDate(draft.date) ?? new Date()

  return (
    <View style={styles.editor}>
      <TextField
        accessibilityLabel="Nombre"
        onChangeText={(title) => onChange({ title })}
        placeholder="Nombre"
        value={draft.title}
      />
      <TextField
        accessibilityLabel="Monto"
        keyboardType="decimal-pad"
        onChangeText={(amount) => onChange({ amount })}
        placeholder="Monto"
        trailing={<AppText tone="muted" variant="subtitle">{currencyCode(draft.currency)}</AppText>}
        value={draft.amount}
      />
      <MovementDateField
        date={date}
        onChange={(next) => onChange({ date: next })}
        onClose={onCloseDate}
        onOpen={onOpenDate}
        open={openDate}
        value={draft.date}
      />
      {draft.time ? (
        <AppText tone="muted" variant="caption">Hora {draft.time.slice(0, 5)}</AppText>
      ) : null}
      {categoriesLoading ? (
        <AppText tone="muted" variant="caption">Cargando categorías...</AppText>
      ) : categoriesError ? (
        <AppText tone="muted" variant="caption">No se pudieron cargar las categorías.</AppText>
      ) : categories && categories.length === 0 ? (
        <AppText tone="muted" variant="caption">
          {entryType === "expense"
            ? "Este espacio no tiene categorías de gasto."
            : "Este espacio no tiene categorías de ingreso."}
        </AppText>
      ) : (
        <NativeMenu
          accessibilityLabel="Categoría"
          entries={(categories ?? []).map((category) => ({
            id: category.id,
            selected: category.id === draft.categoryId,
            title: categoryLabel(category),
          }))}
          label={selected ? categoryLabel(selected) : "Categoría"}
          onSelect={(id) => {
            if (categories?.some((category) => category.id === id)) onChange({ categoryId: id })
          }}
          variant="field"
        />
      )}
      <Button label="Quitar" onPress={onRemove} size="compact" style={styles.remove} tone="destructive" />
    </View>
  )
}

function MovementDateField({
  date,
  onChange,
  onClose,
  onOpen,
  open,
  value,
}: {
  date: Date
  onChange: (value: string) => void
  onClose: () => void
  onOpen: () => void
  open: boolean
  value: string
}) {
  if (Platform.OS === "ios") {
    return (
      <View style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}>
        <AppText variant="subtitle">Fecha</AppText>
        <DateTimePicker
          accentColor={colors.brand}
          accessibilityLabel="Fecha"
          display="compact"
          locale="es-AR"
          mode="date"
          onChange={(_event, next) => {
            if (next) onChange(toLocalDateString(next))
          }}
          themeVariant="dark"
          value={date}
        />
      </View>
    )
  }

  if (Platform.OS === "web") {
    return (
      <TextField
        accessibilityLabel="Fecha"
        autoCapitalize="none"
        onChangeText={onChange}
        placeholder="AAAA-MM-DD"
        value={value}
      />
    )
  }

  return (
    <View style={styles.dateBlock}>
      <Pressable
        accessibilityLabel="Fecha"
        accessibilityRole="button"
        onPress={onOpen}
        style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}
      >
        <AppText variant="subtitle">Fecha</AppText>
        <AppText tone="muted" variant="subtitle">{formatTransactionDate(value)}</AppText>
      </Pressable>
      {open ? (
        <DateTimePicker
          accentColor={colors.brand}
          display="default"
          mode="date"
          onChange={(event, next) => commitNativeDate(event, next, onChange, onClose)}
          value={date}
        />
      ) : null}
    </View>
  )
}

function commitNativeDate(
  event: DateTimePickerEvent,
  date: Date | undefined,
  onChange: (value: string) => void,
  onClose: () => void,
) {
  if (event.type === "dismissed" || !date) {
    onClose()
    return
  }
  onChange(toLocalDateString(date))
  onClose()
}

function MovementGroup({
  movements,
  reason,
  reasonFor,
  title,
}: {
  movements: ScreenshotMovement[]
  reason?: string
  reasonFor?: (movement: ScreenshotMovement) => string
  title: string
}) {
  return (
    <View style={styles.group}>
      <AppText variant="sectionTitle">{title}</AppText>
      {movements.map((movement, index) => (
        <MovementRow
          excludedReason={reasonFor?.(movement) ?? reason}
          key={`${movement.date}-${movement.time ?? ""}-${movement.amount}-${movement.title}-${index}`}
          movement={movement}
        />
      ))}
    </View>
  )
}

function MovementRow({
  excludedReason,
  movement,
}: {
  excludedReason?: string
  movement: ScreenshotMovement
}) {
  const expense = movement.type === "expense"

  return (
    <View style={[styles.row, styles.excluded]}>
      <View style={styles.titleRow}>
        <AppText numberOfLines={2} style={styles.title} variant="subtitle">
          {movement.title}
        </AppText>
        <Text style={[styles.amount, expense ? styles.expenseAmount : styles.incomeAmount]}>
          {expense ? "-" : "+"}
          {formatMoney(movement.amount, movement.currency)}
        </Text>
      </View>
      <AppText tone="muted" variant="caption">
        {expense ? "Gasto" : "Ingreso"}
        {" · "}
        {formatTransactionDate(movement.date)}
        {movement.time ? ` · ${movement.time.slice(0, 5)}` : ""}
      </AppText>
      {excludedReason ? (
        <AppText tone="muted" variant="caption">{excludedReason}</AppText>
      ) : null}
    </View>
  )
}

function toDraft(
  item: ScreenshotMovement,
  index: number,
  fallbackCategoryId: string | null,
): DraftMovement {
  return {
    key: String(index),
    title: item.title,
    amount: String(item.amount),
    date: item.date,
    time: item.time,
    currency: item.currency,
    categoryId: item.categoryId ?? fallbackCategoryId,
  }
}

function prepareDraft(
  draft: DraftMovement,
  categoryIds: ReadonlySet<string> | null,
): { movement: ReadyMovement } | { error: string } {
  const title = draft.title.trim()
  if (!title) return { error: "Escribe un nombre para cada movimiento." }

  const amount = Number(draft.amount.replace(",", "."))
  if (!amount || amount <= 0) return { error: "Escribe un monto válido." }

  const parsedDate = parseLocalDate(draft.date)
  if (!parsedDate || toLocalDateString(parsedDate) !== draft.date) {
    return { error: "Elige una fecha válida." }
  }
  if (!draft.categoryId || (categoryIds && !categoryIds.has(draft.categoryId))) {
    return { error: "Elige una categoría para cada movimiento." }
  }

  return {
    movement: {
      key: draft.key,
      title,
      amount,
      date: draft.date,
      time: draft.time,
      categoryId: draft.categoryId,
    },
  }
}

function targetsForItem(
  targets: LinkedTransactionTarget[],
  householdId: string,
  categoryId: string,
) {
  return targets.map((target) => ({
    householdId: target.householdId,
    categoryId: target.householdId === householdId ? categoryId : target.categoryId,
  }))
}

function categoryLabel(category: Category) {
  return category.icon ? `${category.icon} ${category.name}` : category.name
}

function heldBackReason(
  movement: ScreenshotMovement,
  entryType: "expense" | "income",
) {
  if (movement.type !== entryType) {
    return entryType === "expense"
      ? "Queda afuera porque estás cargando un gasto."
      : "Queda afuera porque estás cargando un ingreso."
  }
  return "Queda afuera porque la moneda no coincide con el espacio."
}

function partialSaveMessage(saved: number) {
  if (saved === 0) return "No se pudo guardar el movimiento."
  if (saved === 1) return "Se guardó 1 movimiento. No se pudo guardar el resto."
  return `Se guardaron ${saved} movimientos. No se pudo guardar el resto.`
}

const styles = StyleSheet.create({
  group: {
    gap: layout.titleContentGap,
  },
  editor: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: layout.titleContentGap,
    padding: 12,
  },
  dateBlock: {
    gap: 8,
  },
  remove: {
    alignSelf: "flex-start",
  },
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  excluded: {
    opacity: 0.72,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
  },
  amount: {
    flexShrink: 0,
    fontFamily: fonts.monoSemibold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "right",
  },
  expenseAmount: {
    color: colors.destructive,
  },
  incomeAmount: {
    color: colors.brand,
  },
})
