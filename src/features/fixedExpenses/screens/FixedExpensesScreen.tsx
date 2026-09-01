import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg"

import { useDeleteFixedExpense } from "../hooks/useDeleteFixedExpense"
import {
  getCurrentFixedExpensePeriod,
  useFixedExpensePeriods,
} from "../hooks/useFixedExpensePeriods"
import { useFixedExpenses } from "../hooks/useFixedExpenses"
import { usePayFixedExpensePeriod } from "../hooks/usePayFixedExpensePeriod"
import type { FixedExpense, FixedExpensePeriod } from "../types"
import { NotificationPermissionBanner } from "../../notifications/components/NotificationPermissionBanner"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"
import { useProfile } from "../../profile/hooks/useProfile"
import { useDashboard } from "../../dashboard/hooks/useDashboard"
import { HomeBalance } from "../../home/components/HomeBalance"
import { HomeGreeting } from "../../home/components/HomeGreeting"
import { HomeIncomeExpenseSummary } from "../../home/components/HomeIncomeExpenseSummary"
import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { TopSection } from "../../../components/layout/TopSection"
import { TopSectionHeader } from "../../../components/layout/TopSectionHeader"
import { useCreateTransactionSheet } from "../../transactions/components/CreateTransactionSheetProvider"

export function FixedExpensesScreen({ navigation }: any) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [processingPeriodId, setProcessingPeriodId] = useState<string | null>(null)
  const [topSectionHeight, setTopSectionHeight] = useState(0)
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile()
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useDashboard()
  const { openEditFixedExpense } = useCreateTransactionSheet()
  const { data, isLoading, error } = useFixedExpenses()
  const currentPeriod = getCurrentFixedExpensePeriod()
  const periodsQuery = useFixedExpensePeriods(
    data !== undefined && data.length > 0,
    currentPeriod
  )
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

  function handleTopSectionLayout(event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height
    setTopSectionHeight((current) => current || height)
  }

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

  if (isLoading || periodsLoading || profileLoading || dashboardLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>
  }

  if (error || periodsError || profileError || dashboardError) {
    const loadError = error ?? periodsError ?? profileError ?? dashboardError

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
    <View style={styles.screenWrapper}>
      <ScreenContainer paddingHorizontal={0}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          style={!topSectionHeight ? styles.hiddenList : undefined}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            topSectionHeight > 0 ? (
              <View>
                <View style={{ height: topSectionHeight }} />
                <NotificationPermissionBanner />
              </View>
            ) : null
          }
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
                <View style={styles.cardHeader}>
                  <Text style={styles.name} numberOfLines={1}>
                    {period?.category?.icon ?? item.category?.icon
                      ? `${period?.category?.icon ?? item.category?.icon} `
                      : ""}
                    {period?.name ?? item.name}
                  </Text>
                  <Text style={styles.amount} numberOfLines={1}>
                    {formatCurrency(period?.expectedAmount ?? item.amount, currency)}
                  </Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoText}>
                      Inicia: {String(item.charge_day).padStart(2, "0")} cada mes
                    </Text>
                    <Text style={styles.infoText}>
                      Vence: {String(item.due_day).padStart(2, "0")} cada mes
                    </Text>
                  </View>
                  <View style={styles.infoColumn}>
                    {period ? (
                      <>
                        <Text style={styles.infoText}>
                          Pagado: {formatCurrency(period.totalPaid, currency)}
                        </Text>
                        <Text style={styles.infoText}>
                          Pendiente: {formatCurrency(period.remaining, currency)}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>

                <View style={styles.separator} />

                {period ? (
                  <View style={styles.statusProgress}>
                    <Text style={styles.status}>{getStatusLabel(period.status)}</Text>
                    <PaymentProgress period={period} />
                  </View>
                ) : null}

                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => openEditFixedExpense(item, currentPeriod)}
                  >
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionButton}
                    disabled={deletingId !== null}
                    onPress={() => confirmDelete(item)}
                  >
                    <Text style={styles.actionButtonText}>
                      {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                    </Text>
                  </Pressable>

                  {period && period.remaining > 0 ? (
                    <>
                      <View style={styles.gradientButton}>
                        <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
                          <Defs>
                            <LinearGradient
                              id="fixed-expense-complete-gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <Stop offset="0" stopColor="#BFFFC7" />
                              <Stop offset="1" stopColor="#18A5A7" />
                            </LinearGradient>
                          </Defs>
                          <Rect
                            width="100%"
                            height="100%"
                            fill="url(#fixed-expense-complete-gradient)"
                          />
                        </Svg>
                        <Pressable
                          accessibilityLabel="Pago completado"
                          disabled={processingPeriodId !== null}
                          style={[styles.actionButton, styles.gradientActionButton, processingPeriodId !== null && styles.disabled]}
                          onPress={() => confirmComplete(period)}
                        >
                          <Text style={[styles.actionButtonText, styles.completeActionButtonText]}>
                            {processingPeriodId === period.id ? "Procesando..." : "Pago Completo"}
                          </Text>
                        </Pressable>
                      </View>

                      <Pressable
                        accessibilityLabel="Pago parcial"
                        disabled={processingPeriodId !== null}
                        style={[styles.actionButton, processingPeriodId !== null && styles.disabled]}
                        onPress={() => navigation.navigate("PayFixedExpensePeriod", { periodId: period.id })}
                      >
                        <Text style={styles.actionButtonText}>Pago Parcial</Text>
                      </Pressable>
                    </>
                  ) : null}

                  {period?.lastPayment ? (
                    <Pressable
                      accessibilityLabel="Corregir último pago"
                      disabled={processingPeriodId !== null}
                      style={[styles.actionButton, processingPeriodId !== null && styles.disabled]}
                      onPress={() => navigation.navigate("CorrectFixedExpensePayment", { paymentId: period.lastPayment!.id })}
                    >
                      <Text style={styles.actionButtonText}>Corregir Último Pago</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            )
          }}
        />
      </ScreenContainer>
      <TopSection
        mode="collapsed"
        overlay
        onLayout={handleTopSectionLayout}
        style={styles.topSectionOverlay}
        renderContent={(collapseProgress) => (
          <>
            <TopSectionHeader collapseProgress={collapseProgress} profile={profile} />
            <HomeGreeting displayName={profile?.name?.trim()} collapseProgress={collapseProgress} />
            <HomeBalance
              balance={dashboard?.balance ?? 0}
              collapseProgress={collapseProgress}
              isCollapsed
            />
            <HomeIncomeExpenseSummary
              collapseProgress={collapseProgress}
              expenses={dashboard?.expenses ?? 0}
              income={dashboard?.income ?? 0}
            />
          </>
        )}
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
  screenWrapper: { flex: 1, position: "relative" },
  topSectionOverlay: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  hiddenList: { opacity: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  list: { gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
  card: {
    backgroundColor: "#EEEEEE",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 15,
  },
  name: {
    flex: 1,
    flexShrink: 1,
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 24,
  },
  amount: {
    flexShrink: 1,
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 24,
    lineHeight: 24,
    textAlign: "right",
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: "#000000",
  },
  infoGrid: {
    flexDirection: "row",
    width: "100%",
    marginVertical: 15,
  },
  infoColumn: {
    width: "50%",
    gap: 8,
  },
  infoText: {
    color: "rgba(28,28,28,0.7)",
    fontFamily: "Satoshi-Bold",
    fontSize: 12,
    lineHeight: 12,
  },
  statusProgress: {
    marginTop: 15,
    gap: 8,
  },
  status: {
    color: "rgba(28,28,28,0.7)",
    fontFamily: "Satoshi-Bold",
    fontSize: 16,
    lineHeight: 16,
  },
  disabled: { opacity: 0.55 },
  progressSection: { gap: 6 },
  progressLabel: {
    color: "rgba(28,28,28,0.7)",
    fontFamily: "Satoshi-Bold",
    fontSize: 12,
    lineHeight: 12,
  },
  progressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#B6B6B6",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#000000",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 15,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#000000",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 12,
    lineHeight: 12,
  },
  gradientActionButton: {
    backgroundColor: "transparent",
  },
  completeActionButtonText: {
    color: "#1C1C1C",
  },
  gradientButton: {
    borderRadius: 999,
    overflow: "hidden",
  },
  empty: { color: "#777", textAlign: "center", padding: 24 },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 24 },
  emptyDescription: { color: "#777", textAlign: "center", paddingHorizontal: 16 },
  emptyButton: { marginTop: 8, padding: 14, borderRadius: 10, backgroundColor: "#111" },
  errorDetail: { color: "#b42318", textAlign: "center" },
})
