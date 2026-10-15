import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Button } from "../../../components/buttons/Button"
import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import type { AppStackParamList } from "../../../navigation/types"
import { colors, fonts, layout, radii } from "../../../theme"
import { currencyCode, formatMoney } from "../../../utils/formatMoney"
import { sharedSpaceCurrency } from "../../households/data/currencies"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { setLastCategoryId, setLastEntryMode } from "../services/entryPreferences"
import { formatTransactionDate } from "../utils/transactionFilters"
import { useCreateLinkedTransactions } from "../hooks/useCreateLinkedTransactions"
import type { ScreenshotMovement } from "../types"

type ImportMovementsScreenProps = NativeStackScreenProps<AppStackParamList, "ImportMovements">

export function ImportMovementsScreen({ navigation, route }: ImportMovementsScreenProps) {
  const { duplicates, entryType, items, targets } = route.params
  const householdsQuery = useHouseholds()
  const memberships = householdsQuery.data
  const createTransactionMutation = useCreateLinkedTransactions()
  const [savedCount, setSavedCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const saveLock = useRef(false)
  const alive = useRef(true)
  const currency = sharedSpaceCurrency(targets, memberships)
  const insertable = currency
    ? items.filter((item) => item.type === entryType && currencyCode(item.currency) === currency)
    : []
  const heldBack = items.filter((item) => !insertable.includes(item))
  const pending = insertable.slice(savedCount)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  async function handleConfirm() {
    if (saveLock.current || pending.length === 0) return
    const readyTargets = targets.flatMap((target) =>
      target.categoryId
        ? [{ householdId: target.householdId, categoryId: target.categoryId }]
        : [],
    )
    if (readyTargets.length !== targets.length) {
      Alert.alert("Error", "Selecciona una categoría para cada espacio.")
      return
    }

    saveLock.current = true
    setSaving(true)
    let saved = savedCount
    try {
      for (const item of pending) {
        if (!alive.current) return
        try {
          await createTransactionMutation.mutateAsync({
            type: item.type,
            title: item.title,
            amount: item.amount,
            transactionDate: item.date,
            transactionTime: item.time,
            targets: readyTargets,
          })
          saved += 1
          if (alive.current) setSavedCount(saved)
        } catch {
          if (alive.current) Alert.alert("Error", partialSaveMessage(saved))
          return
        }
      }

      await Promise.all(
        readyTargets.map((target) => setLastCategoryId(target.householdId, entryType, target.categoryId)),
      )
      await setLastEntryMode(entryType)
      if (alive.current) navigation.popToTop()
    } finally {
      saveLock.current = false
      if (alive.current) setSaving(false)
    }
  }

  return (
    <SheetScaffold
      footer={memberships && pending.length > 0 ? (
        <Button
          disabled={saving}
          label={saving ? "Guardando..." : confirmLabel(pending.length)}
          onPress={() => {
            void handleConfirm()
          }}
          tone="brand"
        />
      ) : undefined}
      onClose={() => navigation.goBack()}
      title="Revisar capturas"
    >
      {householdsQuery.isLoading ? (
        <ActivityIndicator color={colors.brand} />
      ) : householdsQuery.isError ? (
        <AppText variant="body">No se pudieron cargar tus espacios.</AppText>
      ) : (
        <>
          {pending.length === 0 && savedCount === 0 ? (
            <AppText variant="body">No hay movimientos nuevos.</AppText>
          ) : pending.length > 0 ? (
            <MovementGroup
              movements={pending}
              title={pending.length === 1 ? "Para cargar" : `Para cargar · ${pending.length}`}
            />
          ) : null}

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
    <View style={[styles.row, excludedReason ? styles.excluded : null]}>
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

function confirmLabel(count: number) {
  return count === 1 ? "Cargar movimiento" : `Cargar ${count} movimientos`
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
