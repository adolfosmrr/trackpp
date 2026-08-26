import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { useDeleteFixedExpense } from "../hooks/useDeleteFixedExpense"
import { useFixedExpensePeriods } from "../hooks/useFixedExpensePeriods"
import { useFixedExpenses } from "../hooks/useFixedExpenses"
import { usePayFixedExpensePeriod } from "../hooks/usePayFixedExpensePeriod"
import type { FixedExpense, FixedExpensePeriod } from "../types"
import { NotificationPermissionBanner } from "../../notifications/components/NotificationPermissionBanner"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"

export function FixedExpensesScreen({ navigation }: any) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [processingPeriodId, setProcessingPeriodId] = useState<string | null>(null)
  const { data, isLoading, error } = useFixedExpenses()
  const periodsQuery = useFixedExpensePeriods(data !== undefined && data.length > 0)
  const {
    data: periods,
    isLoading: periodsLoading,
    error: periodsError,
  } = periodsQuery
  const deleteMutation = useDeleteFixedExpense()
  const payMutation = usePayFixedExpensePeriod()
  const { data: memberships } = useHouseholds()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const selectedHousehold = memberships?.find(
    (membership) => membership.household.id === selectedHouseholdId
  )
  const currency = selectedHousehold?.household.currency ?? "ARS"

  function confirmDelete(expense: FixedExpense) {
    Alert.alert(
      "¿Eliminar gasto fijo?",
      `${expense.name} dejará de aparecer entre tus gastos fijos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void handleDelete(expense.id),
        },
      ]
    )
  }

  async function handleDelete(id: string) {
    if (deletingId) return
    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    } catch (deleteError) {
      Alert.alert("Error", deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el gasto fijo.")
    } finally {
      setDeletingId(null)
    }
  }

  function confirmComplete(period: FixedExpensePeriod) {
    if (processingPeriodId || period.remaining <= 0) return

    Alert.alert(
      "Completar pago",
      `Se registrará un pago de ${formatCurrency(period.remaining, currency)} para ${period.name}.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => void handleComplete(period) },
      ]
    )
  }

  async function handleComplete(period: FixedExpensePeriod) {
    if (processingPeriodId || period.remaining <= 0) return

    setProcessingPeriodId(period.id)
    try {
      await payMutation.mutateAsync({ periodId: period.id, amount: period.remaining })
    } catch {
      await periodsQuery.refetch()
      Alert.alert(
        "No se pudo completar el pago",
        "Este gasto ya fue pagado o el saldo pendiente cambió."
      )
    } finally {
      setProcessingPeriodId(null)
    }
  }

  if (isLoading || periodsLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>
  }

  if (error || periodsError) {
    const loadError = error ?? periodsError

    return (
      <View style={styles.center}>
        <Text>No se pudieron cargar los gastos fijos.</Text>
        {__DEV__ && loadError instanceof Error ? (
          <Text style={styles.errorDetail}>{loadError.message}</Text>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <NotificationPermissionBanner />
      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("CreateFixedExpense")}>
        <Text style={styles.primaryButtonText}>Agregar gasto fijo</Text>
      </Pressable>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.empty}>Todavía no tienes gastos fijos.</Text>
            <Text style={styles.emptyDescription}>
              Agrega alquiler, servicios, suscripciones u otros gastos recurrentes.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => navigation.navigate("CreateFixedExpense")}
            >
              <Text style={styles.primaryButtonText}>Agregar gasto fijo</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const period = periods?.find((entry) => entry.fixedExpenseId === item.id)

          return (
          <View style={styles.card}>
            <View style={styles.details}>
              <Text style={styles.name}>{period?.category?.icon ?? item.category?.icon ? `${period?.category?.icon ?? item.category?.icon} ` : ""}{period?.name ?? item.name}</Text>
              <Text style={styles.amount}>{formatCurrency(period?.expectedAmount ?? item.amount, currency)}</Text>
              <Text style={styles.meta}>Vence: {period ? formatDate(period.dueDate) : `día ${item.due_day}`}</Text>
              <Text style={styles.meta}>Categoría: {period?.category?.name ?? item.category?.name ?? "Sin categoría"}</Text>
              {period ? (
                <>
                  <Text style={styles.meta}>Pagado: {formatCurrency(period.totalPaid, currency)}</Text>
                  <Text style={styles.meta}>Pendiente: {formatCurrency(period.remaining, currency)}</Text>
                  <Text style={styles.status}>{getStatusLabel(period.status)}</Text>
                  <PaymentProgress period={period} />
                </>
              ) : null}
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => navigation.navigate("EditFixedExpense", { fixedExpenseId: item.id })}>
                <Text style={styles.link}>Editar</Text>
              </Pressable>
              {period && period.remaining > 0 ? (
                <View style={styles.paymentActions}>
                  <Pressable
                    accessibilityLabel="Pago completado"
                    disabled={processingPeriodId !== null}
                    style={[styles.paymentButton, styles.completeButton, processingPeriodId !== null && styles.disabled]}
                    onPress={() => confirmComplete(period)}
                  >
                    <Text style={styles.completeButtonText}>
                      {processingPeriodId === period.id ? "Procesando..." : "Pago completado"}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Pago parcial"
                    disabled={processingPeriodId !== null}
                    style={[styles.paymentButton, styles.partialButton, processingPeriodId !== null && styles.disabled]}
                    onPress={() => navigation.navigate("PayFixedExpensePeriod", { periodId: period.id })}
                  >
                    <Text style={styles.partialButtonText}>Pago parcial</Text>
                  </Pressable>
                </View>
              ) : null}
              {period?.lastPayment ? (
                <Pressable
                  accessibilityLabel="Corregir último pago"
                  disabled={processingPeriodId !== null}
                  onPress={() => navigation.navigate("CorrectFixedExpensePayment", { paymentId: period.lastPayment!.id })}
                >
                  <Text style={styles.correctionLink}>Corregir último pago</Text>
                </Pressable>
              ) : null}
              <Pressable disabled={deletingId !== null} onPress={() => confirmDelete(item)}>
                <Text style={styles.delete}>{deletingId === item.id ? "Eliminando..." : "Eliminar"}</Text>
              </Pressable>
            </View>
          </View>
          )
        }}
      />
    </View>
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
}

function PaymentProgress({ period }: { period: FixedExpensePeriod }) {
  const paymentPercentage = period.expectedAmount > 0
    ? (period.totalPaid / period.expectedAmount) * 100
    : 0
  const progressPercentage = Math.max(0, Math.min(paymentPercentage, 100))
  const visiblePercentage = Math.round(progressPercentage)

  return (
    <View style={styles.progressSection} accessible accessibilityLabel={`${visiblePercentage}% pagado`}>
      <Text style={styles.progressLabel}>{visiblePercentage}% pagado</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
      </View>
    </View>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T00:00:00`))
}

function getStatusLabel(status: string) {
  switch (status) {
    case "upcoming": return "Próximo"
    case "pending": return "Pendiente"
    case "partial": return "Parcial"
    case "paid": return "Pagado"
    case "overdue": return "Vencido"
    default: return status
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  primaryButton: { padding: 15, borderRadius: 10, backgroundColor: "#111", alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
  list: { gap: 12, paddingTop: 16, paddingBottom: 24 },
  card: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 14, padding: 16, gap: 14 },
  details: { gap: 4 },
  name: { fontSize: 17, fontWeight: "700" },
  amount: { fontSize: 18, fontWeight: "700", marginVertical: 4 },
  meta: { color: "#555" },
  status: { fontWeight: "700", marginTop: 4 },
  actions: { flexDirection: "row", gap: 18 },
  paymentActions: { flex: 1, flexDirection: "row", gap: 8 },
  paymentButton: { flex: 1, padding: 11, borderRadius: 9, alignItems: "center" },
  completeButton: { backgroundColor: "#111" },
  completeButtonText: { color: "#fff", fontWeight: "600", textAlign: "center" },
  partialButton: { borderWidth: 1, borderColor: "#111" },
  partialButtonText: { color: "#111", fontWeight: "600", textAlign: "center" },
  disabled: { opacity: 0.55 },
  progressSection: { gap: 6, marginTop: 8 },
  progressLabel: { color: "#555", fontWeight: "600" },
  progressTrack: { height: 8, overflow: "hidden", borderRadius: 4, backgroundColor: "#e5e5e5" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#111" },
  link: { fontWeight: "600" },
  correctionLink: { color: "#555", fontWeight: "600" },
  delete: { color: "#b42318", fontWeight: "600" },
  empty: { color: "#777", textAlign: "center", padding: 24 },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 24 },
  emptyDescription: { color: "#777", textAlign: "center", paddingHorizontal: 16 },
  emptyButton: { marginTop: 8, padding: 14, borderRadius: 10, backgroundColor: "#111" },
  errorDetail: { color: "#b42318", textAlign: "center" },
})
