import { useEffect, useRef, useState } from "react"
import { useIsFocused } from "@react-navigation/native"

import {
  AccessibilityInfo,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
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
import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { TopSection } from "../../../components/layout/TopSection"
import { TopSectionHeader } from "../../../components/layout/TopSectionHeader"
import { TopSectionHandle } from "../../../components/layout/TopSectionHandle"
import { HomeBalance } from "../components/HomeBalance"
import { HomeGreeting } from "../components/HomeGreeting"
import { HomeIncomeExpenseSummary } from "../components/HomeIncomeExpenseSummary"
import { HomeInsightCard } from "../components/HomeInsightCard"
import { HomeInsightSkeleton } from "../components/HomeInsightSkeleton"
import {
  HomeInfoCard,
  type HomeInfoCardVariant,
} from "../components/HomeInfoCard"
import { HomeSectionTitle } from "../components/HomeSectionTitle"
import { HomeSectionToggle } from "../components/HomeSectionToggle"
import { MovementsSection } from "../components/MovementsSection"
import { StackedCardList } from "../components/StackedCardList"
import { InsightSectionIcon } from "../components/icons/InsightSectionIcon"
import { UpcomingPaymentsSectionIcon } from "../components/icons/UpcomingPaymentsSectionIcon"
import { useHomeAiInsight } from "../hooks/useHomeAiInsight"
import { useHomeInsightActionDetails } from "../hooks/useHomeInsightActionDetails"

const INSIGHT_SLOT_HEIGHT = 112
const SCROLL_TRIGGER_DELTA = 3
const INFO_CARD_VARIANTS: HomeInfoCardVariant[] = [
  "darkGradientText",
  "light",
  "gradient",
]
const UPCOMING_PAYMENT_VARIANTS: HomeInfoCardVariant[] = [
  "gradient",
  "light",
  "dark",
]

export function HomeScreen({
  navigation,
}: any) {
  const { user } = useAuth()
  const isFocused = useIsFocused()
  const markedSeenForHousehold = useRef<string | null>(
    null
  )
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isUpcomingPaymentsExpanded, setIsUpcomingPaymentsExpanded] = useState(false)
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)
  const collapseProgress = useSharedValue(0)
  const previousScrollY = useSharedValue(0)
  const lastScrollY = useSharedValue(0)
  const collapseTriggered = useSharedValue(false)

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
    collapseTriggered.value = nextCollapsed
    previousScrollY.value = lastScrollY.value
    cancelAnimation(collapseProgress)
    collapseProgress.value = reduceMotionEnabled
      ? nextCollapsed ? 1 : 0
      : withTiming(nextCollapsed ? 1 : 0, { duration: 290 })
  }

  const syncCollapsedState = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
  }

  const syncHandleDragState = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    collapseTriggered.value = collapsed
    previousScrollY.value = lastScrollY.value
  }

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: (event) => {
      const currentY = Math.max(0, event.contentOffset.y)
      previousScrollY.value = currentY
      lastScrollY.value = currentY
    },
    onScroll: (event) => {
      const currentY = Math.max(0, event.contentOffset.y)
      const deltaY = currentY - previousScrollY.value
      previousScrollY.value = currentY
      lastScrollY.value = currentY

      if (
        currentY > 0 &&
        deltaY > SCROLL_TRIGGER_DELTA &&
        !collapseTriggered.value &&
        collapseProgress.value < 1
      ) {
        collapseTriggered.value = true
        cancelAnimation(collapseProgress)
        collapseProgress.value = reduceMotionEnabled
          ? 1
          : withTiming(1, { duration: 290 })
        runOnJS(syncCollapsedState)(true)
      }
    },
  })

  const animatedInsightSlotStyle = useAnimatedStyle(() => ({
    marginBottom: interpolate(collapseProgress.value, [0, 1], [60, 0]),
    marginTop: interpolate(collapseProgress.value, [0, 1], [30, 0]),
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
        <TopSectionHandle
          collapseProgress={collapseProgress}
          onDragEnd={syncHandleDragState}
          onPress={toggleCollapsed}
          reduceMotionEnabled={reduceMotionEnabled}
        />
      </TopSection>
      <ScreenContainer paddingHorizontal={0}>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
      {insights?.length ? (
        <View>
          <HomeSectionTitle
            icon={<InsightSectionIcon />}
            title="Para tener en cuenta"
            rightElement={
              <HomeSectionToggle
                expanded={isExpanded}
                onPress={() => setIsExpanded((expanded) => !expanded)}
              />
            }
          />

          <StackedCardList
            items={insights}
            expanded={isExpanded}
            reduceMotionEnabled={reduceMotionEnabled}
            renderItem={(insight, index) => (
              <HomeInfoCard
                icon={insight.categoryIcon}
                message={insight.message}
                variant={INFO_CARD_VARIANTS[index % INFO_CARD_VARIANTS.length]}
              />
            )}
          />
        </View>
      ) : null}

      {reminders?.length ? (
        <View>
          <HomeSectionTitle
            icon={<UpcomingPaymentsSectionIcon />}
            title="Próximos pagos"
            rightElement={
              <HomeSectionToggle
                expanded={isUpcomingPaymentsExpanded}
                onPress={() => setIsUpcomingPaymentsExpanded((expanded) => !expanded)}
              />
            }
          />
          <StackedCardList
            items={reminders}
            expanded={isUpcomingPaymentsExpanded}
            reduceMotionEnabled={reduceMotionEnabled}
            renderItem={(reminder, index) => (
              <Pressable
                onPress={() => {
                  if (reminder.remaining > 0) {
                    navigation.navigate("PayFixedExpensePeriod", {
                      periodId: reminder.fixedExpensePeriodId,
                    })
                  } else {
                    navigation.navigate("FixedExpenses")
                  }
                }}
              >
                <HomeInfoCard
                  icon={reminder.categoryIcon}
                  message={reminder.message}
                  variant={UPCOMING_PAYMENT_VARIANTS[index % UPCOMING_PAYMENT_VARIANTS.length]}
                />
              </Pressable>
            )}
          />
        </View>
      ) : null}

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
        <MovementsSection
          transactions={dashboard?.recentTransactions ?? []}
          onViewAll={() => navigation.navigate("Transactions")}
        />
      )}

        </Animated.ScrollView>
      </ScreenContainer>
    </View>
  )
}

const styles =
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 0,
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

    activitySection: {
      gap: 12,
    },

    activityList: {
      gap: 10,
    },

    activityStatus: {
      color: "#777",
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

    empty: {
      color: "#777",
      textAlign: "center",
      paddingVertical: 24,
    },

  })
