import {
  View,
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useQueryClient } from "@tanstack/react-query"
import type { CompositeScreenProps } from "@react-navigation/native"
import type { NativeBottomTabScreenProps } from "@react-navigation/bottom-tabs/unstable"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { colors, layout, refreshControlColors } from "../../../theme"
import { AppText } from "../../../components/text/AppText"
  import { useEffect, useState } from "react"

  import { useAuth } from "../../auth/context/AuthContext"
  import { useProfile } from "../../profile/hooks/useProfile"
  import { useDashboard } from "../../dashboard/hooks/useDashboard"
  import { useHouseholds } from "../../households/hooks/useHouseholds"
  import { useHouseholdStore } from "../../../store/householdStore"
  import { ScreenContainer } from "../../../components/layout/ScreenContainer"
  import { TopSection } from "../../../components/layout/TopSection"
  import { TopSectionHeader } from "../../../components/layout/TopSectionHeader"
  import { HomeBalance } from "../../home/components/HomeBalance"
  import { HomeGreeting } from "../../home/components/HomeGreeting"
  import { HomeIncomeExpenseSummary } from "../../home/components/HomeIncomeExpenseSummary"
import { TransactionsMovementsSection } from "../components/TransactionsMovementsSection"
import { showUndo } from "../../../components/feedback/undo"
import { createMovementParams } from "../openCreateMovement"
  import { useTransactions } from "../hooks/useTransactions"
  import { useCreateLinkedTransactions } from "../hooks/useCreateLinkedTransactions"
import { useDeleteTransaction } from "../hooks/useDeleteTransaction"
  import {
    defaultTransactionFilters,
    type Transaction,
    type TransactionFilters,
  } from "../types"
import type { AppStackParamList, MainTabsParamList } from "../../../navigation/types"

type TransactionsScreenProps = CompositeScreenProps<
  NativeBottomTabScreenProps<MainTabsParamList, "Transactions">,
  NativeStackScreenProps<AppStackParamList>
>

  export function TransactionsScreen({ navigation, route }: TransactionsScreenProps) {
    const queryClient = useQueryClient()
    const [topSectionHeight, setTopSectionHeight] = useState(0)
    const [appliedFilters, setAppliedFilters] = useState(defaultTransactionFilters)
    const [refreshing, setRefreshing] = useState(false)
    const deleteMutation = useDeleteTransaction()
    const restoreMutation = useCreateLinkedTransactions()

    function handleTopSectionLayout(event: LayoutChangeEvent) {
      const height = event.nativeEvent.layout.height
      setTopSectionHeight((current) => current || height)
    }

    const { user } = useAuth()
    const profileQuery = useProfile()
    const {
      data: profile,
      isLoading: profileLoading,
      error: profileError,
    } = profileQuery
    const dashboardQuery = useDashboard()
    const {
      data: dashboard,
      isLoading: dashboardLoading,
      error: dashboardError,
    } = dashboardQuery
    const selectedHouseholdId = useHouseholdStore(
      (state) => state.selectedHouseholdId
    )
    const householdsQuery = useHouseholds()
    const { data: memberships } = householdsQuery
    const currentHousehold = memberships?.find(
      (membership) => membership.household.id === selectedHouseholdId
    )?.household

    const transactionsQuery = useTransactions()
    const {
      data: transactions,
      isLoading,
      error,
    } = transactionsQuery
    const householdType = currentHousehold?.type === "couple" ? "couple" : "personal"
    const activeFilterCount = getActiveFilterCount(appliedFilters, householdType)

    useEffect(() => {
      const next = route.params?.appliedFilters
      if (!next) return
      setAppliedFilters({
        ...next,
        creatorId: householdType === "couple" ? next.creatorId : null,
      })
      navigation.setParams({ appliedFilters: undefined })
    }, [householdType, navigation, route.params?.appliedFilters])

    async function handleRefresh() {
      setRefreshing(true)
      try {
        await Promise.all([
          profileQuery.refetch(),
          dashboardQuery.refetch(),
          householdsQuery.refetch(),
          transactionsQuery.refetch(),
        ])
      } finally {
        setRefreshing(false)
      }
    }

    function openFilters() {
      navigation.navigate("TransactionFilters", {
        filters: householdType === "couple"
          ? appliedFilters
          : { ...appliedFilters, creatorId: null },
      })
    }

    async function requestDelete(transaction: Transaction) {
      const queryKey = ["transactions", selectedHouseholdId] as const
      const previous = queryClient.getQueryData<Transaction[]>(queryKey)
      queryClient.setQueryData<Transaction[]>(
        queryKey,
        (current) => current?.filter((item) => item.id !== transaction.id),
      )

      try {
        await deleteMutation.mutateAsync(transaction.id)
      } catch (error) {
        queryClient.setQueryData(queryKey, previous)
        showUndo({
          message: isFixedExpenseDeleteError(error)
            ? "Ese movimiento es de un gasto fijo. Gestionarlo desde Fijos."
            : "No se pudo eliminar el movimiento.",
        })
        return
      }

      showUndo({
        message: "Eliminaste el movimiento",
        actionLabel: "Deshacer",
        onAction: () => {
          void restoreMutation.mutateAsync({
            type: transaction.type,
            title: transaction.title,
            description: transaction.description ?? undefined,
            amount: Math.abs(transaction.amount),
            transactionDate: transaction.transaction_date,
            targets: [{
              householdId: transaction.household_id,
              categoryId: transaction.category_id,
            }],
          }).catch(() => {
            showUndo({ message: "No se pudo deshacer el movimiento." })
          })
        },
      })
    }

    if (isLoading || profileLoading || dashboardLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      )
    }
  
    if (error || profileError || dashboardError) {
      return (
        <View style={styles.center}>
          <AppText tone="muted" variant="body">No se pudieron cargar los movimientos.</AppText>
        </View>
      )
    }
  
    return (
      <View style={styles.screenWrapper}>
        <ScreenContainer paddingHorizontal={0}>
        <FlatList
          data={[{ id: "transactions-section" }]}
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
            topSectionHeight > 0
              ? <View style={{ height: topSectionHeight }} />
              : null
          }
          renderItem={() => (
            <TransactionsMovementsSection
              transactions={transactions ?? []}
              householdType={householdType}
              userId={user?.id}
              onDelete={requestDelete}
              onCreate={() => {
                void createMovementParams().then((params) => {
                  navigation.navigate("CreateMovement", params)
                })
              }}
              onClearFilters={() => {
                setAppliedFilters(defaultTransactionFilters)
              }}
              filters={householdType === "couple"
                ? appliedFilters
                : { ...appliedFilters, creatorId: null }}
              activeFilterCount={activeFilterCount}
              onOpenFilters={openFilters}
            />
          )}
         />
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

  function isFixedExpenseDeleteError(error: unknown) {
    return error instanceof Error && error.message.includes("FIXED_EXPENSE_TRANSACTION_CANNOT_BE_DELETED")
  }

  function getActiveFilterCount(
    filters: TransactionFilters,
    householdType: "personal" | "couple",
  ) {
    return Number(filters.type !== "all")
      + Number(filters.date.type !== "any")
      + Number(filters.categoryId !== null)
      + Number(householdType === "couple" && filters.creatorId !== null)
      + Number(filters.order !== "newest")
  }

  const styles = StyleSheet.create({
    screenWrapper: {
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

    hiddenList: {
      opacity: 0,
    },

    center: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
  
    list: {
      paddingTop: layout.sheetPadding,
      gap: 12,
    },
  
  })
