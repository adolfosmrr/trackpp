import { useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Button } from "../../../components/buttons/Button"
import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import type { AppStackParamList } from "../../../navigation/types"
import { colors, fonts, layout, radii } from "../../../theme"
import { formatMoney } from "../../../utils/formatMoney"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { setLastCategoryId, setLastEntryMode } from "../services/entryPreferences"
import { formatTransactionDate } from "../utils/transactionFilters"
import { useCreateLinkedTransactions } from "../hooks/useCreateLinkedTransactions"
import type { LinkedTransactionTarget, ScreenshotMovement } from "../types"

type ImportMovementsScreenProps = NativeStackScreenProps<AppStackParamList, "ImportMovements">

export function ImportMovementsScreen({ navigation, route }: ImportMovementsScreenProps) {
  const { duplicates, entryType, items, targets } = route.params
  const householdsQuery = useHouseholds()
  const memberships = householdsQuery.data
  const createTransactionMutation = useCreateLinkedTransactions()
  const [savedCount, setSavedCount] = useState(0)
  const currency = sharedCurrency(targets, memberships)
  const insertable = currency
    ? items.filter((item) => item.type === entryType && sameCurrency(item.currency, currency))
    : []
  const heldBack = items.filter((item) => !insertable.includes(item))
  const pending = insertable.slice(savedCount)
  const saving = createTransactionMutation.isPending

  async function handleConfirm() {
    if (saving || pending.length === 0) return
    const readyTargets = targets.flatMap((target) =>
      target.categoryId
        ? [{ householdId: target.householdId, categoryId: target.categoryId }]
        : [],
    )
    if (readyTargets.length !== targets.length) {
      Alert.alert("Error", "Selecciona una categoría para cada espacio.")
      return
    }

    let saved = savedCount
    for (const item of pending) {
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
        setSavedCount(saved)
      } catch {
        Alert.alert("Error", partialSaveMessage(saved))
        return
      }
    }

    await Promise.all(
      readyTargets.map((target) => setLastCategoryId(target.householdId, entryType, target.categoryId)),
    )
    await setLastEntryMode(entryType)
    navigation.popToTop()
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

function sharedCurrency(
  targets: LinkedTransactionTarget[],
  memberships: ReturnType<typeof useHouseholds>["data"],
) {
  if (!memberships || targets.length === 0) return null

  const codes = targets.map((target) =>
    memberships.find((membership) => membership.household_id === target.householdId)
      ?.household.currency
      ?.trim()
      .toUpperCase() ?? "",
  )
  if (codes.some((code) => code.length === 0)) return null

  const unique = new Set(codes)
  if (unique.size !== 1) return null
  return codes[0] ?? null
}

function sameCurrency(left: string, right: string) {
  return left.trim().toUpperCase() === right.trim().toUpperCase()
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
