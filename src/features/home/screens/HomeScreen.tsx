import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useIsFocused } from "@react-navigation/native"

import {
  AccessibilityInfo,
  LayoutChangeEvent,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
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
import { ActivityItem } from "../../activity/components/ActivityItem"
import { useActivity } from "../../activity/hooks/useActivity"
import { useUnreadActivity } from "../../activity/hooks/useUnreadActivity"
import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { TopSection } from "../../../components/layout/TopSection"
import { TopSectionHeader } from "../../../components/layout/TopSectionHeader"
import { TopSectionHandle } from "../../../components/layout/TopSectionHandle"
import { HomeBalance } from "../components/HomeBalance"
import { HomeGreeting } from "../components/HomeGreeting"
import { HomeIncomeExpenseSummary } from "../components/HomeIncomeExpenseSummary"
import { DueSoonCard } from "../components/DueSoonCard"
import { HomeAiSection } from "../components/HomeAiSection"
import { MovementsSection } from "../components/MovementsSection"
import { colors, fonts, radii, refreshControlColors } from "../../../theme"
import {
  settleTopSectionProgress,
  topSectionCollapseRange,
  topSectionSnapTarget,
} from "../../../components/layout/topSectionCollapse"
import { useCreateTransactionSheet } from "../../transactions/components/CreateTransactionSheetProvider"
import { useDelayedHomeAmounts } from "../hooks/useDelayedHomeAmounts"
import { PendingChargesBanner } from "../../pendingCharges/components/PendingChargesBanner"

const SCROLL_TRIGGER_DELTA = 3

export function HomeScreen({
  navigation,
}: any) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isFocused = useIsFocused()
  const markedSeenForHousehold = useRef<string | null>(
    null
  )
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedTopSectionHeight, setExpandedTopSectionHeight] = useState(0)
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const isCollapsedRef = useRef(false)
  const collapseProgress = useSharedValue(0)
  const previousScrollY = useSharedValue(0)
  const collapseTriggered = useSharedValue(false)
  const pullingToRefresh = useSharedValue(false)
  const expandedHeightShared = useSharedValue(0)
  const collapseRangeShared = useSharedValue(topSectionCollapseRange())
  const reduceMotionShared = useSharedValue(false)
  const panStartProgress = useSharedValue(0)
  const panStartTranslation = useSharedValue(0)
  const panStartScroll = useSharedValue(0)
  const draggingPanel = useSharedValue(false)
  const settlingPanel = useSharedValue(false)
  const acceptExpandedLayout = useSharedValue(true)
  const reportedExpandedHeight = useSharedValue(0)
  const lockedExpandedHeight = useSharedValue(false)
  const scrollActive = useSharedValue(false)
  const drivingList = useSharedValue(false)
  const scrollY = useSharedValue(0)
  const scrollContentHeight = useSharedValue(0)
  const scrollLayoutHeight = useSharedValue(0)
  const lastScrollContentHeight = useSharedValue(0)
  const contentJustShrank = useSharedValue(false)
  const scrollRef = useAnimatedRef<Animated.ScrollView>()

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

  useEffect(() => {
    reduceMotionShared.value = reduceMotionEnabled
  }, [reduceMotionEnabled, reduceMotionShared])

  const commitCollapsed = useCallback((collapsed: boolean) => {
    isCollapsedRef.current = collapsed
    setIsCollapsed(collapsed)
    collapseTriggered.value = collapsed
  }, [collapseTriggered])

  const commitExpandedHeight = useCallback((height: number) => {
    setExpandedTopSectionHeight((current) => (current === height ? current : height))
  }, [])

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: (event) => {
      cancelAnimation(scrollY)
      drivingList.value = false
      scrollActive.value = true
      const offsetY = event.contentOffset.y
      pullingToRefresh.value = offsetY < 0
      previousScrollY.value = Math.max(0, offsetY)
      scrollY.value = offsetY
    },
    onScroll: (event) => {
      const rawY = event.contentOffset.y
      const contentHeight = event.contentSize.height
      const contentShrank = lastScrollContentHeight.value > contentHeight + 0.5
      if (contentHeight > 0) lastScrollContentHeight.value = contentHeight
      if (contentShrank) contentJustShrank.value = true
      else if (rawY > 0) contentJustShrank.value = false

      if (drivingList.value) {
        previousScrollY.value = Math.max(0, rawY)
        return
      }

      scrollY.value = rawY
      const wasPulling = pullingToRefresh.value

      if (rawY < 0) {
        pullingToRefresh.value = true
      }

      if (rawY <= 0) {
        const maxOffset = Math.max(0, contentHeight - event.layoutMeasurement.height)
        const clampedByLayout = previousScrollY.value > maxOffset + 0.01 && rawY <= maxOffset + 0.01
        const scrolledBackToTop =
          scrollActive.value &&
          previousScrollY.value > 0 &&
          collapseTriggered.value &&
          !wasPulling &&
          !clampedByLayout &&
          !settlingPanel.value &&
          !contentShrank &&
          !contentJustShrank.value
        previousScrollY.value = 0
        if (scrolledBackToTop) {
          collapseTriggered.value = false
          settleTopSectionProgress(
            collapseProgress,
            collapseRangeShared,
            reduceMotionShared,
            settlingPanel,
            acceptExpandedLayout,
            0,
          )
          runOnJS(commitCollapsed)(false)
        }
        return
      }

      if (wasPulling) {
        previousScrollY.value = rawY
        return
      }

      const deltaY = rawY - previousScrollY.value
      previousScrollY.value = rawY

      if (
        deltaY > SCROLL_TRIGGER_DELTA &&
        !collapseTriggered.value &&
        collapseProgress.value < 1
      ) {
        collapseTriggered.value = true
        settleTopSectionProgress(
          collapseProgress,
          collapseRangeShared,
          reduceMotionShared,
          settlingPanel,
          acceptExpandedLayout,
          1,
        )
        runOnJS(commitCollapsed)(true)
      }
    },
    onEndDrag: (event) => {
      const velocityY = event.velocity?.y ?? 0
      if (Math.abs(velocityY) < 0.1) scrollActive.value = false
      if (event.contentOffset.y >= 0) pullingToRefresh.value = false
    },
    onMomentumBegin: () => {
      scrollActive.value = true
    },
    onMomentumEnd: (event) => {
      scrollActive.value = false
      if (event.contentOffset.y >= 0) pullingToRefresh.value = false
    },
  })

  useAnimatedReaction(
    () => reportedExpandedHeight.value,
    (height) => {
      if (lockedExpandedHeight.value) return
      if (!acceptExpandedLayout.value || draggingPanel.value || settlingPanel.value) return
      if (collapseProgress.value !== 0 || height <= 0) return
      lockedExpandedHeight.value = true
      expandedHeightShared.value = height
      runOnJS(commitExpandedHeight)(height)
    },
  )

  useAnimatedReaction(
    () => scrollY.value,
    (y) => {
      if (!drivingList.value) return
      scrollTo(scrollRef, 0, y, false)
    },
  )

  const topSectionSpacerStyle = useAnimatedStyle(() => {
    const expanded = expandedHeightShared.value
    if (expanded <= 0) return { height: 0 }
    const collapsed = Math.max(0, expanded - collapseRangeShared.value)
    return {
      height: interpolate(
        collapseProgress.value,
        [0, 1],
        [expanded, collapsed],
        Extrapolation.CLAMP
      ),
    }
  })

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

  const profileQuery = useProfile()
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = profileQuery

  const householdsQuery = useHouseholds()
  const {
    data: memberships,
    isLoading: householdsLoading,
    error: householdsError,
  } = householdsQuery

  const currentHousehold = memberships?.find(
    (membership) => membership.household.id === selectedHouseholdId
  )?.household
  const displayName = profile?.name?.trim()

  const activityQuery = useActivity(currentHousehold?.type === "couple")
  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
  } = activityQuery

  const isCoupleHousehold =
    currentHousehold?.type === "couple"
  const {
    unreadCount,
    markAsSeen,
    isMarkingSeen,
    refetch: refetchUnreadActivity,
  } = useUnreadActivity(isCoupleHousehold)

  const { openCreateTransaction } = useCreateTransactionSheet()

  const handleExpandedLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height
    if (height <= 0) return
    reportedExpandedHeight.value = height
  }, [reportedExpandedHeight])

  const handleScrollContentSize = useCallback((_width: number, height: number) => {
    if (scrollContentHeight.value > height + 0.5) contentJustShrank.value = true
    scrollContentHeight.value = height
  }, [contentJustShrank, scrollContentHeight])

  const handleScrollLayout = useCallback((event: LayoutChangeEvent) => {
    scrollLayoutHeight.value = event.nativeEvent.layout.height
  }, [scrollLayoutHeight])

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .failOffsetX([-15, 15])
        .onStart((event) => {
          cancelAnimation(collapseProgress)
          cancelAnimation(scrollY)
          draggingPanel.value = true
          settlingPanel.value = false
          acceptExpandedLayout.value = false
          drivingList.value = false
          panStartProgress.value = collapseProgress.value
          panStartTranslation.value = event.translationY
          panStartScroll.value = Math.max(0, scrollY.value)
        })
        .onUpdate((event) => {
          const dy = event.translationY - panStartTranslation.value
          if (!drivingList.value && panStartProgress.value >= 0.999 && dy < 0) {
            drivingList.value = true
          }
          if (drivingList.value) {
            const maxY = Math.max(0, scrollContentHeight.value - scrollLayoutHeight.value)
            const next = Math.min(maxY, Math.max(0, panStartScroll.value - dy))
            scrollY.value = next
            return
          }
          const range = Math.max(1, collapseRangeShared.value)
          const next = panStartProgress.value - dy / range
          collapseProgress.value = Math.min(1, Math.max(0, next))
        })
        .onEnd((event) => {
          draggingPanel.value = false
          if (drivingList.value) {
            const maxY = Math.max(0, scrollContentHeight.value - scrollLayoutHeight.value)
            const velocity = -event.velocityY
            if (reduceMotionShared.value || Math.abs(velocity) < 50 || maxY <= 0) {
              drivingList.value = false
              return
            }
            scrollY.value = withDecay(
              {
                velocity,
                clamp: [0, Math.max(maxY, scrollY.value)],
              },
              (finished) => {
                if (!finished) return
                const landedAtTop = scrollY.value <= 0
                drivingList.value = false
                if (!landedAtTop || !collapseTriggered.value || settlingPanel.value) return
                collapseTriggered.value = false
                previousScrollY.value = 0
                settleTopSectionProgress(
                  collapseProgress,
                  collapseRangeShared,
                  reduceMotionShared,
                  settlingPanel,
                  acceptExpandedLayout,
                  0,
                )
                runOnJS(commitCollapsed)(false)
              },
            )
            return
          }
          const target = topSectionSnapTarget(collapseProgress.value, event.velocityY)
          settleTopSectionProgress(
            collapseProgress,
            collapseRangeShared,
            reduceMotionShared,
            settlingPanel,
            acceptExpandedLayout,
            target,
            event.velocityY,
          )
          runOnJS(commitCollapsed)(target === 1)
        })
        .onFinalize(() => {
          draggingPanel.value = false
        }),
    [
      acceptExpandedLayout,
      collapseProgress,
      collapseRangeShared,
      commitCollapsed,
      draggingPanel,
      drivingList,
      collapseTriggered,
      panStartProgress,
      panStartScroll,
      panStartTranslation,
      previousScrollY,
      reduceMotionShared,
      scrollContentHeight,
      scrollLayoutHeight,
      scrollRef,
      scrollY,
      settlingPanel,
    ],
  )

  const toggleCollapsed = useCallback(() => {
    const nextCollapsed = !isCollapsedRef.current
    commitCollapsed(nextCollapsed)
    settleTopSectionProgress(
      collapseProgress,
      collapseRangeShared,
      reduceMotionShared,
      settlingPanel,
      acceptExpandedLayout,
      nextCollapsed ? 1 : 0,
    )
  }, [
    acceptExpandedLayout,
    collapseProgress,
    collapseRangeShared,
    commitCollapsed,
    reduceMotionShared,
    settlingPanel,
  ])

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

  const dashboardQuery = useDashboard()
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = dashboardQuery
  const displayedHomeAmounts = useDelayedHomeAmounts(
    {
      balance: dashboard?.balance ?? 0,
      income: dashboard?.income ?? 0,
      expenses: dashboard?.expenses ?? 0,
    },
    isFocused,
    !dashboardLoading && !!dashboard,
  )

  const collapsedTopSectionHeight = Math.max(
    0,
    expandedTopSectionHeight - topSectionCollapseRange(),
  )
  const refreshProgressOffset = isCollapsed ? collapsedTopSectionHeight : expandedTopSectionHeight

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        profileQuery.refetch(),
        householdsQuery.refetch(),
        dashboardQuery.refetch(),
        activityQuery.refetch(),
        refetchUnreadActivity(),
        queryClient.invalidateQueries({ queryKey: ["pending-charges"] }),
        queryClient.invalidateQueries({ queryKey: ["home-ai-insight"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-insights"] }),
        queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["fixed-expense-periods"] }),
      ])
    } finally {
      setRefreshing(false)
    }
  }

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

  }, [
    profileError,
    householdsError,
    dashboardError,
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
        <ActivityIndicator color={colors.brand} size="large" />
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
        <Text style={styles.activityStatus}>
          No se pudieron cargar los datos.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <ScreenContainer paddingHorizontal={0}>
        <Animated.ScrollView
          ref={scrollRef}
          onContentSizeChange={handleScrollContentSize}
          onLayout={handleScrollLayout}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              progressViewOffset={refreshProgressOffset}
              {...refreshControlColors}
            />
          }
          style={[styles.scrollView, !expandedTopSectionHeight && styles.hiddenScroll]}
          contentContainerStyle={[
            styles.scrollContent,
          ]}
        >
      <Animated.View
        pointerEvents="none"
        style={topSectionSpacerStyle}
      />
      <DueSoonCard onPress={() => navigation.navigate("FixedExpenses")} />
      <PendingChargesBanner
        onPress={() => navigation.navigate("PendingCharges")}
      />
      <MovementsSection
        transactions={dashboard?.recentTransactions ?? []}
        onViewAll={() => navigation.navigate("Transactions")}
        onCreate={() => {
          void openCreateTransaction()
        }}
      />

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
      ) : null}

      <HomeAiSection />

        </Animated.ScrollView>
      </ScreenContainer>
      <TopSection
        overlay
        onLayout={handleExpandedLayout}
        style={styles.topSectionOverlay}
      >
        <GestureDetector gesture={pan}>
          <View collapsable={false} style={styles.panelGesture}>
            <TopSectionHeader collapseProgress={collapseProgress} profile={profile} />
            <HomeGreeting displayName={displayName} collapseProgress={collapseProgress} />
            <HomeBalance balance={displayedHomeAmounts.balance} collapseProgress={collapseProgress} isCollapsed={isCollapsed} />
            <HomeIncomeExpenseSummary
              collapseProgress={collapseProgress}
              expenses={displayedHomeAmounts.expenses}
              income={displayedHomeAmounts.income}
            />
            <TopSectionHandle collapseProgress={collapseProgress} onPress={toggleCollapsed} pan={pan} />
          </View>
        </GestureDetector>
      </TopSection>
    </View>
  )
}

const styles =
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },

    hiddenScroll: {
      opacity: 0,
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 120,
      gap: 24,
    },

    screen: {
      flex: 1,
      position: "relative",
      backgroundColor: colors.background,
    },

    topSectionOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },

    panelGesture: {
      marginHorizontal: -20,
      paddingHorizontal: 20,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      padding: 24,
      backgroundColor: colors.background,
    },

    greetingContainer: {
      alignItems: "flex-start",
      marginTop: 20,
    },

    helloText: {
      color: colors.foreground,
      fontFamily: fonts.sans,
      fontSize: 30,
      lineHeight: 34,
      opacity: 0.5,
    },

    userNameText: {
      color: colors.foreground,
      fontFamily: fonts.sans,
      fontSize: 40,
      lineHeight: 44,
    },

    activitySection: {
      gap: 12,
    },

    activityList: {
      gap: 10,
    },

    activityStatus: {
      color: colors.mutedForeground,
      fontFamily: fonts.sans,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    sectionTitle: {
      color: colors.foreground,
      fontFamily: fonts.sansSemibold,
      fontSize: 16,
    },

    activityBadge: {
      backgroundColor: colors.brandMuted,
      borderColor: colors.brandBorder,
      borderRadius: radii.sm,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    activityBadgeText: {
      color: colors.brand,
      fontFamily: fonts.sansMedium,
      fontSize: 12,
    },

    empty: {
      color: colors.mutedForeground,
      fontFamily: fonts.sans,
      textAlign: "center",
      paddingVertical: 24,
    },

  })
