import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import type { CompositeScreenProps } from "@react-navigation/native"
import type { NativeBottomTabScreenProps } from "@react-navigation/bottom-tabs/unstable"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQueryClient } from "@tanstack/react-query"
import { colors, layout, refreshControlColors } from "../../../theme"
import { Button } from "../../../components/buttons/Button"
import { GlassButton } from "../../../components/buttons/GlassButton"
import { AppText } from "../../../components/text/AppText"
import { CircleAddButton } from "../../../components/buttons/CircleAddButton"
import { ListSection } from "../../../components/layout/ListSection"
import { useFormatMoney } from "../../households/hooks/useFormatMoney"
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
import { createMovementParams, editFixedExpenseParams } from "../../transactions/openCreateMovement"
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
  const format = useFormatMoney()
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
      `Se registrará un pago de ${format(period.remaining)} para ${period.name}.`,
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
        <AppText tone="muted" variant="body">No se pudieron cargar los gastos fijos.</AppText>
        {__DEV__ && loadError instanceof Error ? (
          <AppText tone="destructive" variant="caption">{loadError.message}</AppText>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.screenWrapper}>
      <ScreenContainer paddingHorizontal={0}>
        <ScrollView
          style={!topSectionHeight ? styles.hiddenList : undefined}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 0) + 66 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              progressViewOffset={topSectionHeight}
              {...refreshControlColors}
            />
          }
        >
          <ListSection style={styles.list}>
          {topSectionHeight > 0 ? (
            <View>
              <View style={{ height: topSectionHeight }} />
              <NotificationPermissionBanner />
              <SectionHeader
                title="Gastos fijos"
                trailing={
                  <CircleAddButton
                    accessibilityLabel="Agregar gasto fijo"
                    onPress={() => {
                      void createMovementParams("fixed").then((params) => {
                        navigation.navigate("CreateMovement", params)
                      })
                    }}
                  />
                }
              />
            </View>
          ) : null}
          <FixedExpenseList
            emptyBody="Sumá alquiler, servicios o suscripciones para seguirlos todos los meses."
            onCreate={() => {
              void createMovementParams("fixed").then((params) => {
                navigation.navigate("CreateMovement", params)
              })
            }}
            onOpenHistory={(expense) => {
              navigation.navigate("FixedExpenseHistory", { fixedExpenseId: expense.id })
            }}
            renderActions={(expense, period) => {
              const lastPayment = period?.lastPayment
              return (
                <View style={styles.actions}>
                  <GlassButton
                    accessibilityLabel="Editar"
                    label="Editar"
                    onPress={() => {
                      navigation.navigate("CreateMovement", editFixedExpenseParams(expense, currentPeriod))
                    }}
                  />

                  <GlassButton
                    accessibilityLabel={deletingId === expense.id ? "Eliminando..." : "Eliminar"}
                    disabled={deletingId !== null}
                    label={deletingId === expense.id ? "Eliminando..." : "Eliminar"}
                    onPress={() => confirmDelete(expense)}
                  />

                  {period && period.remaining > 0 ? (
                    <>
                      <Button
                        accessibilityLabel="Pago completado"
                        disabled={processingPeriodId !== null}
                        label={processingPeriodId === period.id ? "Procesando..." : "Pago Completo"}
                        onPress={() => confirmComplete(period)}
                        tone="brand"
                      />

                      <GlassButton
                        accessibilityLabel="Pago parcial"
                        disabled={processingPeriodId !== null}
                        label="Pago Parcial"
                        onPress={() => navigation.navigate("PayFixedExpensePeriod", { periodId: period.id })}
                      />
                    </>
                  ) : null}

                  {lastPayment ? (
                    <GlassButton
                      accessibilityLabel="Corregir último pago"
                      disabled={processingPeriodId !== null}
                      label="Corregir Último Pago"
                      onPress={() => navigation.navigate("CorrectFixedExpensePayment", { paymentId: lastPayment.id })}
                    />
                  ) : null}
                </View>
              )
            }}
          />
          </ListSection>
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
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: layout.sheetPadding },
  list: { gap: layout.titleContentGap, paddingTop: 8 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 15,
  },
})
