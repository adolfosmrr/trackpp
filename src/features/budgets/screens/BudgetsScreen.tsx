import { useState } from "react"

import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  RefreshControl,
} from "react-native"
import { colors, fonts, radii, refreshControlColors } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useBudgets } from "../hooks/useBudgets"
import { useDeleteBudget } from "../hooks/useDeleteBudget"
import { useProfile } from "../../profile/hooks/useProfile"
import { useDashboard } from "../../dashboard/hooks/useDashboard"
import { useBudgetSheet } from "../components/BudgetSheetProvider"
import { BudgetSheetProvider } from "../components/BudgetSheetProvider"
import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { TopSection } from "../../../components/layout/TopSection"
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

  function handleDeleteBudget(
    budgetId: string
  ) {
    Alert.alert(
      "Eliminar presupuesto",
      "¿Seguro que quieres eliminar este presupuesto?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBudgetMutation.mutateAsync(
                budgetId
              )
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "No se pudo eliminar el presupuesto."

              Alert.alert(
                "Error",
                message
              )
            }
          },
        },
      ]
    )
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
          style={[styles.container, !topSectionHeight && styles.hiddenList]}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              progressViewOffset={topSectionHeight}
              {...refreshControlColors}
            />
          }
        >
          <View style={{ height: topSectionHeight }} />
          <View style={styles.budgetSection}>
            <View
              style={[
                styles.budgetContent,
                {
                  paddingBottom: Math.max(insets.bottom, 0) + 66,
                },
              ]}
            >
        <Text style={styles.title}>
          Presupuesto{'\n'}del mes
        </Text>

        <Pressable
          style={styles.createBudgetButton}
          onPress={openCreateBudget}
        >
          <Text style={styles.createBudgetButtonText}>
            Crear presupuesto
          </Text>
        </Pressable>

        <View style={styles.list}>
          {budgets?.length ? (
            budgets.map((budget) => (
              <View
                key={budget.id}
                style={styles.card}
              >
                <View
                  style={
                    styles.cardHeader
                  }
                >
                  <Text
                    style={
                      styles.cardTitle
                    }
                  >
                    {budget.name}
                  </Text>

                  <Text
                    style={
                      styles.cardPercentage
                    }
                  >
                    {formatPercentage(
                      budget.percentage
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.progressBackground
                  }
                >
                  <View
                    style={[
                      styles.progress,
                      {
                        width:
                          `${budget.progressPercentage}%`,
                      },
                    ]}
                  />
                </View>

                <View style={styles.cardSeparator} />

                <View style={styles.statsRow}>
                  <View style={styles.statsLeft}>
                    <View style={styles.statItem}>
                      <Text style={styles.statsText}>Gastado</Text>
                      <Text style={styles.statsText}>
                        {formatCurrency(budget.spent)}
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statsText}>
                        Restante
                      </Text>
                      <Text style={styles.statsText}>
                        {formatCurrency(Math.abs(budget.remaining))}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statsText}>De</Text>
                    <Text style={styles.statsText}>
                      {formatCurrency(budget.amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardSeparator} />

                <View
                  style={styles.actions}
                >
                    <Pressable
                      style={styles.actionsButtons}
                      onPress={() =>
                        openEditBudget(budget)
                      }
                    >
                      <Text
                        style={
                          styles.editText
                        }
                      >
                        Editar
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.actionsButtons}
                      onPress={() =>
                        handleDeleteBudget(
                          budget.id
                        )
                      }
                    >
                      <Text
                        style={
                          styles.deleteText
                        }
                      >
                        Eliminar
                      </Text>
                    </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>
              Todavía no tienes
              presupuestos este mes.
            </Text>
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

function formatCurrency(
  amount: number
) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
    }
  ).format(amount)
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
      marginTop: 30
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

    title: {
      color: colors.foreground,
      fontFamily: fonts.sansSemibold,
      fontSize: 22,
      letterSpacing: -0.4,
      lineHeight: 26,
      fontWeight: "600",
    },

    createBudgetButton: {
      width: "100%",
      backgroundColor: colors.brand,
      borderRadius: radii.sm,
      paddingHorizontal: 20,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
    },

    createBudgetButtonText: {
      color: colors.brandForeground,
      fontFamily: fonts.sansSemibold,
      fontSize: 16,
      lineHeight: 16,
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
      backgroundColor: colors.transparent,
      borderColor: colors.borderStrong,
      borderRadius: radii.sm,
      borderWidth: 1,
      paddingHorizontal: 20,
      paddingVertical: 10,
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
