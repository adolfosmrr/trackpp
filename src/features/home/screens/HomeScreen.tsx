import { useEffect, useRef, useState } from "react"
import { useIsFocused } from "@react-navigation/native"

import {
  AccessibilityInfo,
  View,
  ScrollView,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import {
  useHouseholdStore,
} from "../../../store/householdStore"

import { useAuth } from "../../auth/context/AuthContext"

import {
  useProfile,
} from "../../profile/hooks/useProfile"

import {
  useHouseholds,
} from "../../households/hooks/useHouseholds"

import {
  useDashboard,
} from "../../dashboard/hooks/useDashboard"
import { useDashboardInsights } from "../../dashboard/hooks/useDashboardInsights"

import { ActivityItem } from "../../activity/components/ActivityItem"
import { useActivity } from "../../activity/hooks/useActivity"
import { useUnreadActivity } from "../../activity/hooks/useUnreadActivity"
import { useFixedExpenseReminders } from "../../fixedExpenses/hooks/useFixedExpenseReminders"
import type { FixedExpenseReminder } from "../../fixedExpenses/types/reminders"
import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { TopSection } from "../../../components/layout/TopSection"
import { TopSectionHeader } from "../../../components/layout/TopSectionHeader"
import { TopSectionHandle } from "../../../components/layout/TopSectionHandle"
import { HomeBalance } from "../components/HomeBalance"
import { HomeGreeting } from "../components/HomeGreeting"
import { HomeIncomeExpenseSummary } from "../components/HomeIncomeExpenseSummary"
import { HomeInsightCard } from "../components/HomeInsightCard"
import { HomeInsightSkeleton } from "../components/HomeInsightSkeleton"
import { useHomeAiInsight } from "../hooks/useHomeAiInsight"
import { useHomeInsightActionDetails } from "../hooks/useHomeInsightActionDetails"

const INSIGHT_SLOT_HEIGHT = 112

export function HomeScreen({
  navigation,
}: any) {
  const { user } = useAuth()
  const isFocused = useIsFocused()
  const markedSeenForHousehold = useRef<string | null>(
    null
  )
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)
  const collapseProgress = useSharedValue(0)

  useEffect(() => {
    let mounted = true

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotionEnabled(enabled)
    })

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled
    )

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  const toggleCollapsed = () => {
    const nextCollapsed = !isCollapsed
    setIsCollapsed(nextCollapsed)
    cancelAnimation(collapseProgress)
    collapseProgress.value = reduceMotionEnabled
      ? nextCollapsed ? 1 : 0
      : withTiming(nextCollapsed ? 1 : 0, { duration: 290 })
  }

  const animatedInsightSlotStyle = useAnimatedStyle(() => ({
    marginBottom: interpolate(collapseProgress.value, [0, 1], [60, 0]),
    marginTop: interpolate(collapseProgress.value, [0, 1], [60, 0]),
    height: interpolate(collapseProgress.value, [0, 1], [INSIGHT_SLOT_HEIGHT, 0]),
  }))
  const animatedInsightContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 1], [1, 0]),
    transform: [{ translateY: interpolate(collapseProgress.value, [0, 1], [0, -12]) }],
  }))

  const selectedHouseholdId =
    useHouseholdStore(
      (state) =>
        state.selectedHouseholdId
    )

  const setSelectedHouseholdId =
    useHouseholdStore(
      (state) =>
        state.setSelectedHouseholdId
    )

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile()

  const {
    data: memberships,
    isLoading: householdsLoading,
    error: householdsError,
  } = useHouseholds()

  const currentHousehold = memberships?.find(
    (membership) => membership.household.id === selectedHouseholdId
  )?.household
  const displayName = profile?.name?.trim()

  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
  } = useActivity(currentHousehold?.type === "couple")

  const isCoupleHousehold =
    currentHousehold?.type === "couple"
  const {
    unreadCount,
    markAsSeen,
    isMarkingSeen,
  } = useUnreadActivity(isCoupleHousehold)

  const {
    data: reminders,
    error: remindersError,
  } = useFixedExpenseReminders()
  const homeInsightQuery = useHomeAiInsight()
  const { actionDetails } = useHomeInsightActionDetails(homeInsightQuery.data)

  useEffect(() => {
    if (!isFocused || !isCoupleHousehold) {
      markedSeenForHousehold.current = null
      return
    }

    if (!selectedHouseholdId || activityLoading || activityError) {
      return
    }

    if (unreadCount === 0) {
      markedSeenForHousehold.current = null
      return
    }

    if (
      unreadCount > 0 &&
      !isMarkingSeen &&
      markedSeenForHousehold.current !== selectedHouseholdId
    ) {
      markedSeenForHousehold.current = selectedHouseholdId
      void markAsSeen()
    }
  }, [
    activityError,
    activityLoading,
    isCoupleHousehold,
    isFocused,
    isMarkingSeen,
    markAsSeen,
    selectedHouseholdId,
    unreadCount,
  ])

  useEffect(() => {
    const selectedMembership = memberships?.find(
      (membership) =>
        membership.household.id === selectedHouseholdId
    )

    if (memberships?.length && !selectedMembership) {
      setSelectedHouseholdId(
        memberships[0].household.id
      )
    }
  }, [
    memberships,
    selectedHouseholdId,
    setSelectedHouseholdId,
  ])

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useDashboard()

  const {
    data: insights,
    error: insightsError,
  } = useDashboardInsights()

  useEffect(() => {
    if (profileError) {
      console.error("Profile error:", profileError)
    }

    if (householdsError) {
      console.error("Households error:", householdsError)
    }

    if (dashboardError) {
      console.error("Dashboard error:", dashboardError)
    }

    if (insightsError && __DEV__) {
      console.error("Dashboard insights error:", insightsError)
    }

    if (remindersError && __DEV__) {
      console.error("Fixed expense reminders error:", remindersError)
    }
  }, [
    profileError,
    householdsError,
    dashboardError,
    insightsError,
    remindersError,
  ])

  useEffect(() => {
    if (activityError && __DEV__) {
      console.error("Activity error:", activityError)
    }
  }, [activityError])

  if (
    profileLoading ||
    householdsLoading ||
    dashboardLoading
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (
    profileError ||
    householdsError ||
    dashboardError
  ) {
    return (
      <View style={styles.center}>
        <Text>
          No se pudieron cargar los datos.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <TopSection>
        <TopSectionHeader collapseProgress={collapseProgress} profile={profile} />
        <HomeGreeting displayName={displayName} collapseProgress={collapseProgress} />
        <HomeBalance balance={dashboard?.balance ?? 0} collapseProgress={collapseProgress} isCollapsed={isCollapsed} />
        <HomeIncomeExpenseSummary
          collapseProgress={collapseProgress}
          expenses={dashboard?.expenses ?? 0}
          income={dashboard?.income ?? 0}
        />
        {homeInsightQuery.isLoading ? (
          <Animated.View
            pointerEvents={isCollapsed ? "none" : "auto"}
            style={[styles.insightSlot, animatedInsightSlotStyle]}
          >
            <Animated.View style={[styles.insightContent, animatedInsightContentStyle]}>
              <HomeInsightSkeleton />
            </Animated.View>
          </Animated.View>
        ) : homeInsightQuery.data?.intro || homeInsightQuery.data?.groups.length ? (
          <Animated.View
            pointerEvents={isCollapsed ? "none" : "auto"}
            style={[styles.insightSlot, animatedInsightSlotStyle]}
          >
            <Animated.View style={[styles.insightContent, animatedInsightContentStyle]}>
              <HomeInsightCard
                actionDetails={actionDetails}
                insight={homeInsightQuery.data}
                isCollapsed={isCollapsed}
                variant="plain"
              />
            </Animated.View>
          </Animated.View>
        ) : null}
        <TopSectionHandle collapseProgress={collapseProgress} onPress={toggleCollapsed} />
      </TopSection>
      <ScreenContainer>
        <ScrollView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>
          Balance del mes
        </Text>

        <Text style={styles.balance}>
          {formatCurrency(
            dashboard?.balance ?? 0
          )}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text
              style={styles.summaryLabel}
            >
              Ingresos
            </Text>

            <Text
              style={styles.incomeAmount}
            >
              {formatCurrency(
                dashboard?.income ?? 0
              )}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text
              style={styles.summaryLabel}
            >
              Gastos
            </Text>

            <Text
              style={styles.expenseAmount}
            >
              {formatCurrency(
                dashboard?.expenses ?? 0
              )}
            </Text>
          </View>
        </View>
      </View>

      {insights?.length ? (
        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>
            Para tener en cuenta
          </Text>

          <View style={styles.insightsList}>
            {insights.map((insight) => (
              <View
                key={insight.id}
                style={styles.insightRow}
              >
                <Text style={styles.insightMarker}>
                  {insight.type === "budget_warning"
                    ? "!"
                    : "↑"}
                </Text>
                <Text style={styles.insightText}>
                  {insight.message}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        style={styles.aiButton}
        onPress={() => navigation.navigate("AiChat")}
        disabled={!currentHousehold}
      >
        <Text style={styles.aiButtonText}>
          Preguntar a IA
        </Text>
      </Pressable>

      {reminders?.length ? (
        <View style={styles.remindersSection}>
          <Text style={styles.sectionTitle}>Próximos pagos</Text>
          <View style={styles.remindersList}>
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onPress={() => {
                  if (reminder.remaining > 0) {
                    navigation.navigate("PayFixedExpensePeriod", {
                      periodId: reminder.fixedExpensePeriodId,
                    })
                  } else {
                    navigation.navigate("FixedExpenses")
                  }
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("FixedExpenses")}
        disabled={!currentHousehold}
      >
        <Text style={styles.secondaryButtonText}>
          Gastos fijos
        </Text>
      </Pressable>

      {isCoupleHousehold ? (
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Actividad compartida
            </Text>

            {unreadCount > 0 && (
              <View style={styles.activityBadge}>
                <Text style={styles.activityBadgeText}>
                  {unreadCount} nuevas
                </Text>
              </View>
            )}
          </View>

          {activityLoading ? (
            <Text style={styles.activityStatus}>
              Cargando actividad...
            </Text>
          ) : activity?.length ? (
            <View style={styles.activityList}>
              {activity.map((item) => (
                <ActivityItem
                  key={item.id}
                  item={item}
                  currentUserId={user?.id}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>
              Todavía no hay actividad compartida.
            </Text>
          )}
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Movimientos recientes
            </Text>

            <Pressable
              onPress={() =>
                navigation.navigate(
                  "Transactions"
                )
              }
            >
              <Text style={styles.link}>
                Ver todos
              </Text>
            </Pressable>
          </View>

          <View style={styles.transactions}>
            {dashboard?.recentTransactions
              .length ? (
              dashboard.recentTransactions.map(
                (transaction) => (
                  <View
                    key={transaction.id}
                    style={
                      styles.transaction
                    }
                  >
                    <View
                      style={
                        styles.transactionInfo
                      }
                    >
                      <Text
                        style={
                          styles.transactionTitle
                        }
                      >
                        {transaction.title}
                      </Text>

                      <Text
                        style={
                          styles.transactionCategory
                        }
                      >
                        {transaction.category
                          ? `${
                              transaction
                                .category
                                .icon ?? ""
                            } ${
                              transaction
                                .category
                                .name
                            }`
                          : "Sin categoría"}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.transactionAmount,
                        transaction.type ===
                        "expense"
                          ? styles.expenseAmount
                          : styles.incomeAmount,
                      ]}
                    >
                      {transaction.type ===
                      "expense"
                        ? "-"
                        : "+"}

                      {formatCurrency(
                        Number(
                          transaction.amount
                        )
                      )}
                    </Text>
                  </View>
                )
              )
            ) : (
              <Text style={styles.empty}>
                No hay movimientos recientes.
              </Text>
            )}
          </View>
        </>
      )}

      <Pressable
        style={styles.primaryButton}
        onPress={() =>
          navigation.navigate(
            "CreateTransaction"
          )
        }
      >
        <Text
          style={styles.primaryButtonText}
        >
          Agregar movimiento
        </Text>
      </Pressable>
        </ScrollView>
      </ScreenContainer>
    </View>
  )
}

function ReminderCard({
  reminder,
  onPress,
}: {
  reminder: FixedExpenseReminder
  onPress: () => void
}) {
  return (
    <Pressable style={styles.reminderCard} onPress={onPress}>
      <Text style={styles.reminderMarker}>
        {reminder.type === "overdue" ? "!" : "•"}
      </Text>
      <Text style={styles.reminderText}>{reminder.message}</Text>
    </Pressable>
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
      maximumFractionDigits: 2,
    }
  ).format(amount)
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: 24,
      gap: 24,
    },

    screen: {
      flex: 1,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      padding: 24,
    },

    greetingContainer: {
      alignItems: "flex-start",
      marginTop: 20,
    },

    helloText: {
      color: "#FFFFFF",
      fontFamily: "FamiljenGrotesk-Regular",
      fontSize: 30,
      lineHeight: 34,
      opacity: 0.5,
    },

    userNameText: {
      color: "#FFFFFF",
      fontFamily: "FamiljenGrotesk-Regular",
      fontSize: 40,
      lineHeight: 44,
    },

    insightSlot: {
      height: INSIGHT_SLOT_HEIGHT,
      marginBottom: 60,
      marginTop: 60,
      position: "relative",
    },

    insightContent: {
      alignItems: "stretch",
      height: INSIGHT_SLOT_HEIGHT,
      justifyContent: "center",
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },

    balanceCard: {
      padding: 22,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 18,
      gap: 16,
    },

    activitySection: {
      gap: 12,
    },

    activityList: {
      gap: 10,
    },

    activityStatus: {
      color: "#777",
    },

    balanceLabel: {
      color: "#777",
    },

    balance: {
      fontSize: 32,
      fontWeight: "700",
    },

    summaryRow: {
      flexDirection: "row",
      gap: 16,
    },

    summaryItem: {
      flex: 1,
    },

    summaryLabel: {
      fontSize: 13,
      color: "#777",
      marginBottom: 4,
    },

    incomeAmount: {
      color: "#067647",
      fontWeight: "700",
    },

    expenseAmount: {
      color: "#b42318",
      fontWeight: "700",
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
    },

    aiButton: {
      borderWidth: 1,
      borderColor: "#111",
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
    },

    aiButtonText: {
      fontWeight: "700",
    },

    secondaryButton: {
      padding: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#111",
      alignItems: "center",
    },

    secondaryButtonText: {
      color: "#111",
      fontWeight: "600",
    },

    remindersSection: {
      gap: 10,
    },

    remindersList: {
      gap: 8,
    },

    reminderCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: "#eee",
      borderRadius: 12,
    },

    reminderMarker: {
      color: "#b42318",
      fontWeight: "700",
      fontSize: 18,
      lineHeight: 20,
    },

    reminderText: {
      flex: 1,
      lineHeight: 20,
    },

    insightsSection: {
      gap: 10,
    },

    insightsTitle: {
      fontSize: 20,
      fontWeight: "700",
    },

    insightsList: {
      gap: 8,
    },

    insightRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },

    insightMarker: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#f1f1f1",
      textAlign: "center",
      lineHeight: 22,
      fontWeight: "700",
    },

    insightText: {
      flex: 1,
      lineHeight: 21,
    },

    activityBadge: {
      backgroundColor: "#111",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    activityBadgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },

    link: {
      fontWeight: "600",
    },

    transactions: {
      gap: 12,
    },

    transaction: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      paddingVertical: 10,
    },

    transactionInfo: {
      flex: 1,
    },

    transactionTitle: {
      fontSize: 16,
      fontWeight: "600",
    },

    transactionCategory: {
      marginTop: 4,
      color: "#777",
    },

    transactionAuthor: {
      marginTop: 4,
      color: "#777",
    },

    transactionAmount: {
      fontSize: 16,
    },

    empty: {
      color: "#777",
      textAlign: "center",
      paddingVertical: 24,
    },

    primaryButton: {
      padding: 16,
      backgroundColor: "#111",
      borderRadius: 12,
      alignItems: "center",
    },

    primaryButtonText: {
      color: "#fff",
      fontWeight: "700",
    },
  })
