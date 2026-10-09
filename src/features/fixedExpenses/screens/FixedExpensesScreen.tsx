import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQueryClient } from "@tanstack/react-query"
import { colors, fonts, radii, refreshControlColors } from "../../../theme"
import { formatMoney } from "../../../utils/formatMoney"
import { EmptyState } from "../../../components/feedback/EmptyState"
import { showUndo } from "../../../components/feedback/undo"
import { useDeleteFixedExpense } from "../hooks/useDeleteFixedExpense"
import { createFixedExpense } from "../services/fixedExpenseService"
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
import { BackLink } from "../../../components/navigation/BackLink"
import { useCreateTransactionSheet } from "../../transactions/components/CreateTransactionSheetProvider"

export function FixedExpensesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [processingPeriodId, setProcessingPeriodId] = useState<string | null>(null)
  const [topSectionHeight, setTopSectionHeight] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const profileQuery = useProfile()
  const { data: profile, isLoading: profileLoading, error: profileError } = profileQuery
  const dashboardQuery = useDashboard()
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = dashboardQuery
  const { openCreateTransaction, openEditFixedExpense } = useCreateTransactionSheet()
  const fixedExpensesQuery = useFixedExpenses()
  const { data, isLoading, error } = fixedExpensesQuery
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
  const householdsQuery = useHouseholds()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await Promise.all([
        profileQuery.refetch(),
        dashboardQuery.refetch(),
        householdsQuery.refetch(),
        fixedExpensesQuery.refetch(),
        periodsQuery.refetch(),
      ])
    } finally {
      setRefreshing(false)
    }
  }

  function handleTopSectionLayout(event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height
    setTopSectionHeight((current) => current || height)
  }

  async function confirmDelete(expense: FixedExpense) {
    if (deletingId) return
    const queryKey = ["fixed-expenses", selectedHouseholdId] as const
    const previous = queryClient.getQueryData<FixedExpense[]>(queryKey)
    queryClient.setQueryData<FixedExpense[]>(
      queryKey,
      (current) => current?.filter((item) => item.id !== expense.id),
    )
    setDeletingId(expense.id)

    try {
      await deleteMutation.mutateAsync(expense.id)
    } catch (deleteError) {
      queryClient.setQueryData(queryKey, previous)
      showUndo({
        message: deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar el gasto fijo.",
      })
      return
    } finally {
      setDeletingId(null)
    }

    showUndo({
      message: "Eliminaste el gasto fijo",
      actionLabel: "Deshacer",
      onAction: () => {
        void createFixedExpense(expense.household_id, {
          name: expense.name,
          amount: expense.amount,
          categoryId: expense.category_id,
          chargeDay: expense.charge_day,
          dueDay: expense.due_day,
          isActive: true,
        }).then(() => {
          void queryClient.invalidateQueries({ queryKey: ["fixed-expenses", expense.household_id] })
          void queryClient.invalidateQueries({ queryKey: ["fixed-expense-periods", expense.household_id] })
          void queryClient.invalidateQueries({ queryKey: ["activity", expense.household_id] })
        }).catch(() => {
          showUndo({ message: "No se pudo deshacer el gasto fijo." })
        })
      },
    })
  }

  function confirmComplete(period: FixedExpensePeriod) {
    if (processingPeriodId || period.remaining <= 0) return

    Alert.alert(
      "Completar pago",
      `Se registrará un pago de ${formatMoney(period.remaining)} para ${period.name}.`,
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
    return (
      <View style={[styles.fallback, { paddingTop: insets.top + 16 }]}>
        <BackLink onPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </View>
    )
  }

  if (error || periodsError || profileError || dashboardError) {
    const loadError = error ?? periodsError ?? profileError ?? dashboardError

    return (
      <View style={[styles.fallback, { paddingTop: insets.top + 16 }]}>
        <BackLink onPress={() => navigation.goBack()} />
        <View style={styles.center}>
        <Text style={styles.empty}>No se pudieron cargar los gastos fijos.</Text>
        {__DEV__ && loadError instanceof Error ? (
          <Text style={styles.errorDetail}>{loadError.message}</Text>
        ) : null}
        </View>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              progressViewOffset={topSectionHeight}
              {...refreshControlColors}
            />
          }
          ListHeaderComponent={
            topSectionHeight > 0 ? (
              <View>
                <View style={{ height: topSectionHeight }} />
                <View style={styles.backRow}>
                  <BackLink onPress={() => navigation.goBack()} />
                </View>
                <NotificationPermissionBanner />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title="Todavía no tenés gastos fijos"
              body="Sumá alquiler, servicios o suscripciones para seguirlos todos los meses."
              actionLabel="Agregar gasto fijo"
              onAction={() => {
                void openCreateTransaction("fixed")
              }}
            />
          }
          renderItem={({ item }) => {
            const period = periods?.find((entry) => entry.fixedExpenseId === item.id)

            return (
              <View style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${item.name}`}
                  onPress={() => openEditFixedExpense(item, currentPeriod)}
                >
                <View style={styles.cardHeader}>
                  <Text style={styles.name} numberOfLines={1}>
                    {period?.category?.icon ?? item.category?.icon
                      ? `${period?.category?.icon ?? item.category?.icon} `
                      : ""}
                    {period?.name ?? item.name}
                  </Text>
                  <Text style={styles.amount} numberOfLines={1}>
                    {formatMoney(period?.expectedAmount ?? item.amount)}
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
                          Pagado: {formatMoney(period.totalPaid)}
                        </Text>
                        <Text style={styles.infoText}>
                          Pendiente: {formatMoney(period.remaining)}
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
                </Pressable>

                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
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
  screenWrapper: { flex: 1, position: "relative", backgroundColor: colors.background },
  topSectionOverlay: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  hiddenList: { opacity: 0 },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 },
  fallback: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  backRow: { marginBottom: 12 },
  list: { gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  primaryButtonText: { color: colors.brandForeground, fontFamily: fonts.sansSemibold, fontWeight: "600" },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 14,
    borderRadius: radii.md,
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
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
  },
  amount: {
    flexShrink: 1,
    color: colors.foreground,
    fontFamily: fonts.monoSemibold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "right",
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
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
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 12,
  },
  statusProgress: {
    marginTop: 15,
    gap: 8,
  },
  status: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 16,
  },
  disabled: { opacity: 0.55 },
  progressSection: { gap: 6 },
  progressLabel: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 12,
  },
  progressTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: radii.xs,
    backgroundColor: colors.control,
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.xs,
    backgroundColor: colors.brand,
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
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    backgroundColor: colors.transparent,
  },
  actionButtonText: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 12,
  },
  gradientActionButton: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  completeActionButtonText: {
    color: colors.brandForeground,
  },
  gradientButton: {
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  empty: { color: colors.mutedForeground, fontFamily: fonts.sans, textAlign: "center", padding: 24 },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 24 },
  emptyDescription: { color: colors.mutedForeground, fontFamily: fonts.sans, textAlign: "center", paddingHorizontal: 16 },
  emptyButton: { marginTop: 8, padding: 12, borderRadius: radii.sm, backgroundColor: colors.brand },
  errorDetail: { color: colors.destructive, fontFamily: fonts.sans, textAlign: "center" },
})
