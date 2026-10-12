import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import type { CompositeScreenProps } from "@react-navigation/native"
import type { NativeBottomTabScreenProps } from "@react-navigation/bottom-tabs/unstable"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQueryClient } from "@tanstack/react-query"
import { colors, fonts, radii, refreshControlColors } from "../../../theme"
import { formatMoney } from "../../../utils/formatMoney"
import { showUndo } from "../../../components/feedback/undo"
import { useDeleteFixedExpense } from "../hooks/useDeleteFixedExpense"
import { createFixedExpense } from "../services/fixedExpenseService"
import {
  getCurrentFixedExpensePeriod,
  useFixedExpensePeriods,
} from "../hooks/useFixedExpensePeriods"
import { FixedExpenseList } from "../components/FixedExpenseList"
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
import { SectionHeader } from "../../../components/layout/SectionHeader"
import { TopSectionHeader } from "../../../components/layout/TopSectionHeader"
import { useCreateTransactionSheet } from "../../transactions/components/CreateTransactionSheetProvider"
import type { AppStackParamList, MainTabsParamList } from "../../../navigation/types"

type FixedExpensesScreenProps = CompositeScreenProps<
  NativeBottomTabScreenProps<MainTabsParamList, "FixedExpenses">,
  NativeStackScreenProps<AppStackParamList>
>

export function FixedExpensesScreen({ navigation }: FixedExpensesScreenProps) {
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
          frequency: expense.frequency,
          autoDebit: expense.auto_debit,
          autoDebitSource: expense.auto_debit_source,
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
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    )
  }

  if (error || periodsError || profileError || dashboardError) {
    const loadError = error ?? periodsError ?? profileError ?? dashboardError

    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No se pudieron cargar los gastos fijos.</Text>
        {__DEV__ && loadError instanceof Error ? (
          <Text style={styles.errorDetail}>{loadError.message}</Text>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.screenWrapper}>
      <ScreenContainer paddingHorizontal={0}>
        <ScrollView
          style={!topSectionHeight ? styles.hiddenList : undefined}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 0) + 66 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              progressViewOffset={topSectionHeight}
              {...refreshControlColors}
            />
          }
        >
          {topSectionHeight > 0 ? (
            <View>
              <View style={{ height: topSectionHeight }} />
              <NotificationPermissionBanner />
              <SectionHeader
                actionLabel="Agregar gasto fijo"
                onAction={() => {
                  void openCreateTransaction("fixed")
                }}
                title="Gastos fijos"
              />
            </View>
          ) : null}
          <FixedExpenseList
            emptyBody="Sumá alquiler, servicios o suscripciones para seguirlos todos los meses."
            onCreate={() => {
              void openCreateTransaction("fixed")
            }}
            onOpenHistory={(expense) => {
              navigation.navigate("FixedExpenseHistory", { fixedExpenseId: expense.id })
            }}
            renderActions={(expense, period) => {
              const lastPayment = period?.lastPayment
              return (
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    style={styles.actionButton}
                    onPress={() => openEditFixedExpense(expense, currentPeriod)}
                  >
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionButton}
                    disabled={deletingId !== null}
                    onPress={() => confirmDelete(expense)}
                  >
                    <Text style={styles.actionButtonText}>
                      {deletingId === expense.id ? "Eliminando..." : "Eliminar"}
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

                  {lastPayment ? (
                    <Pressable
                      accessibilityLabel="Corregir último pago"
                      disabled={processingPeriodId !== null}
                      style={[styles.actionButton, processingPeriodId !== null && styles.disabled]}
                      onPress={() => navigation.navigate("CorrectFixedExpensePayment", { paymentId: lastPayment.id })}
                    >
                      <Text style={styles.actionButtonText}>Corregir Último Pago</Text>
                    </Pressable>
                  ) : null}
                </View>
              )
            }}
          />
        </ScrollView>
      </ScreenContainer>
      <TopSection
        mode="collapsed"
        overlay
        onLayout={handleTopSectionLayout}
        style={styles.topSectionOverlay}
        renderContent={(collapseProgress) => (
          <>
            <TopSectionHeader profile={profile} />
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
  list: { gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  disabled: { opacity: 0.55 },
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
  errorDetail: { color: colors.destructive, fontFamily: fonts.sans, textAlign: "center" },
})
