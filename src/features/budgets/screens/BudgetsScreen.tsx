import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  LayoutChangeEvent,
  RefreshControl,
} from "react-native"
import { colors, fonts, radii, refreshControlColors } from "../../../theme"
import { formatMoney } from "../../../utils/formatMoney"
import { EmptyState } from "../../../components/feedback/EmptyState"
import { showUndo } from "../../../components/feedback/undo"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useBudgets } from "../hooks/useBudgets"
import { useDeleteBudget } from "../hooks/useDeleteBudget"
import { createBudget } from "../services/budgetService"
import { useProfile } from "../../profile/hooks/useProfile"
import { useHouseholdStore } from "../../../store/householdStore"
import { useDashboard } from "../../dashboard/hooks/useDashboard"
import { useBudgetSheet } from "../components/BudgetSheetProvider"
import { BudgetSheetProvider } from "../components/BudgetSheetProvider"
import { getCurrentMonth } from "../hooks/useBudgets"
import type { BudgetWithProgress } from "../types"
import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { TopSection } from "../../../components/layout/TopSection"
import { SectionHeader } from "../../../components/layout/SectionHeader"
import { TopSectionHeader } from "../../../components/layout/TopSectionHeader"
import { HomeBalance } from "../../home/components/HomeBalance"
import { HomeGreeting } from "../../home/components/HomeGreeting"
import { HomeIncomeExpenseSummary } from "../../home/components/HomeIncomeExpenseSummary"

export function BudgetsScreen() {
  return (
    <BudgetSheetProvider>
      <BudgetsScreenContent />
    </BudgetSheetProvider>
  )
}

function BudgetsScreenContent() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const [topSectionHeight, setTopSectionHeight] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const profileQuery = useProfile()
  const { data: profile, isLoading: profileLoading, error: profileError } = profileQuery
  const dashboardQuery = useDashboard()
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = dashboardQuery
  const budgetsQuery = useBudgets()
  const {
    data: budgets,
    isLoading: budgetsLoading,
    error: budgetsError,
  } = budgetsQuery

  const deleteBudgetMutation = useDeleteBudget()
  const { openCreateBudget, openEditBudget } = useBudgetSheet()

  function handleTopSectionLayout(event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height
    setTopSectionHeight((current) => current || height)
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await Promise.all([
        profileQuery.refetch(),
        dashboardQuery.refetch(),
        budgetsQuery.refetch(),
      ])
    } finally {
      setRefreshing(false)
    }
  }

  async function handleDeleteBudget(budgetId: string) {
    const month = getCurrentMonth()
    const queryKey = ["budgets", selectedHouseholdId, month] as const
    const budget = queryClient
      .getQueryData<BudgetWithProgress[]>(queryKey)
      ?.find((item) => item.id === budgetId)
    const previous = queryClient.getQueryData<BudgetWithProgress[]>(queryKey)
    queryClient.setQueryData<BudgetWithProgress[]>(
      queryKey,
      (current) => current?.filter((item) => item.id !== budgetId),
    )

    try {
      await deleteBudgetMutation.mutateAsync(budgetId)
    } catch (error) {
      queryClient.setQueryData(queryKey, previous)
      showUndo({
        message: error instanceof Error
          ? error.message
          : "No se pudo eliminar el presupuesto.",
      })
      return
    }

    if (!budget) {
      showUndo({ message: "Eliminaste el presupuesto" })
      return
    }

    showUndo({
      message: "Eliminaste el presupuesto",
      actionLabel: "Deshacer",
      onAction: () => {
        void createBudget({
          householdId: budget.household_id,
          categoryId: budget.category_id,
          userId: budget.created_by,
          name: budget.name,
          amount: budget.amount,
          month: budget.month,
        }).then(() => {
          void queryClient.invalidateQueries({ queryKey: ["budgets", budget.household_id] })
          void queryClient.invalidateQueries({ queryKey: ["dashboard", budget.household_id] })
          void queryClient.invalidateQueries({ queryKey: ["dashboard-insights", budget.household_id] })
          void queryClient.invalidateQueries({ queryKey: ["activity", budget.household_id] })
        }).catch(() => {
          showUndo({ message: "No se pudo deshacer el presupuesto." })
        })
      },
    })
  }

  if (
    budgetsLoading ||
    profileLoading ||
    dashboardLoading
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    )
  }

  if (budgetsError || profileError || dashboardError) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>
          No se pudieron cargar los presupuestos.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.screenWrapper}>
      <ScreenContainer paddingHorizontal={0}>
        <ScrollView
          style={[
            styles.container,
            !topSectionHeight && styles.hiddenList,
          ]}
          contentContainerStyle={[
            styles.content,
            { paddingTop: topSectionHeight },
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
          <View style={styles.budgetSection}>
            <View
              style={[
                styles.budgetContent,
                {
                  paddingBottom: Math.max(insets.bottom, 0) + 66,
                },
              ]}
            >
              <SectionHeader
                    actionLabel="Crear presupuesto"
                    onAction={openCreateBudget}
                    title="Presupuesto del mes"
                  />

                  <View style={styles.list}>
                    {budgets?.length ? (
                      budgets.map((budget) => (
                        <View key={budget.id} style={styles.card}>
                          <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{budget.name}</Text>
                            <Text style={styles.cardPercentage}>
                              {formatPercentage(budget.percentage)}
                            </Text>
                          </View>

                          <View style={styles.progressBackground}>
                            <View
                              style={[
                                styles.progress,
                                { width: `${budget.progressPercentage}%` },
                              ]}
                            />
                          </View>

                          <View style={styles.cardSeparator} />

                          <View style={styles.statsRow}>
                            <View style={styles.statsLeft}>
                              <View style={styles.statItem}>
                                <Text style={styles.statsText}>Gastado</Text>
                                <Text style={styles.statsText}>
                                  {formatMoney(budget.spent)}
                                </Text>
                              </View>

                              <View style={styles.statItem}>
                                <Text style={styles.statsText}>Restante</Text>
                                <Text style={styles.statsText}>
                                  {formatMoney(Math.abs(budget.remaining))}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.statItem}>
                              <Text style={styles.statsText}>De</Text>
                              <Text style={styles.statsText}>
                                {formatMoney(budget.amount)}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.cardSeparator} />

                          <View style={styles.actions}>
                            <Pressable
                              accessibilityRole="button"
                              style={styles.actionsButtons}
                              onPress={() => openEditBudget(budget)}
                            >
                              <Text style={styles.editText}>Editar</Text>
                            </Pressable>

                            <Pressable
                              accessibilityRole="button"
                              style={styles.actionsButtons}
                              onPress={() => handleDeleteBudget(budget.id)}
                            >
                              <Text style={styles.deleteText}>Eliminar</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))
                    ) : (
                      <EmptyState
                        title="Este mes no armaste presupuestos"
                        body="Definí un tope por categoría para seguir el gasto."
                        actionLabel="Crear presupuesto"
                        onAction={openCreateBudget}
                      />
                    )}
                  </View>
            </View>
          </View>
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

function formatPercentage(
  percentage: number
) {
  return `${new Intl.NumberFormat(
    "es-AR",
    {
      maximumFractionDigits: 0,
    }
  ).format(percentage)}%`
}

const styles =
  StyleSheet.create({
    screenWrapper: {
      flex: 1,
      position: "relative",
      backgroundColor: colors.background,
    },

    topSectionOverlay: {
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 10,
    },

    hiddenList: {
      opacity: 0,
    },

    container: {
      flex: 1,
    },

    content: {
      flexGrow: 1,
    },

    budgetSection: {
      backgroundColor: colors.background,
      flexGrow: 1,
      paddingTop: 8,
    },

    budgetContent: {
      paddingHorizontal: 20,
      gap: 18,
    },

    center: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
    },

    list: {
      gap: 14,
      marginTop: 6,
    },

    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      gap: 12,
      padding: 14,
    },

    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    cardTitle: {
      color: colors.foreground,
      fontFamily: fonts.sansSemibold,
      fontSize: 16,
      lineHeight: 24,
    },

    cardPercentage: {
      color: colors.foreground,
      fontFamily: fonts.monoSemibold,
      fontSize: 16,
      lineHeight: 24,
    },

    progressBackground: {
      height: 6,
      backgroundColor: colors.control,
      borderRadius: radii.xs,
      overflow: "hidden",
    },

    progress: {
      height: "100%",
      backgroundColor: colors.brand,
    },

    cardSeparator: {
      width: "100%",
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 15,
    },

    statsLeft: {
      gap: 8
    },

    statsRow: {
      flex: 1,
      flexDirection: "row",
      justifyContent: 'space-between',
    },

    statItem: {
      gap: 5,
      flexDirection: 'row'
    },

    statsText: {
      color: colors.mutedForeground,
      fontFamily: fonts.mono,
      fontSize: 13,
      lineHeight: 16,
    },

    actions: {
      flexDirection: "row",
      justifyContent: 'flex-end',
      gap: 10,
      flexWrap: "wrap",
    },

    actionsButtons: {
      alignItems: "center",
      backgroundColor: colors.transparent,
      borderColor: colors.borderStrong,
      borderRadius: radii.sm,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: 20,
    },

    editText: {
      color: colors.foreground,
      fontFamily: fonts.sansMedium,
      fontSize: 12,
      lineHeight: 12,
    },

    deleteText: {
      color: colors.destructive,
      fontFamily: fonts.sansMedium,
      fontSize: 12,
      lineHeight: 12,
    },

    empty: {
      textAlign: "center",
      color: colors.mutedForeground,
      fontFamily: fonts.sans,
      paddingVertical: 30,
    },

  })
