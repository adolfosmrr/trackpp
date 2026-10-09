import {
  View,
  Text,
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useQueryClient } from "@tanstack/react-query"
import { colors, fonts, refreshControlColors } from "../../../theme"
  import { useMemo, useState } from "react"

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
import { TransactionFiltersModal } from "../components/TransactionFiltersModal"
import { useCreateTransactionSheet } from "../components/CreateTransactionSheetProvider"
  import { useTransactions } from "../hooks/useTransactions"
  import { useDeleteTransaction } from "../hooks/useDeleteTransaction"
  import {
    defaultTransactionFilters,
    type Transaction,
    type TransactionFilters,
  } from "../types"
  import {
    getTransactionCategories,
    getTransactionCreators,
  } from "../utils/transactionFilters"

  export function TransactionsScreen() {
    const queryClient = useQueryClient()
    const [topSectionHeight, setTopSectionHeight] = useState(0)
    const [appliedFilters, setAppliedFilters] = useState(defaultTransactionFilters)
    const [draftFilters, setDraftFilters] = useState(defaultTransactionFilters)
    const [filtersVisible, setFiltersVisible] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const deleteMutation = useDeleteTransaction()
    const { openCreateTransaction } = useCreateTransactionSheet()

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
    const transactionList = transactions ?? []
    const householdType = currentHousehold?.type === "couple" ? "couple" : "personal"
    const categories = useMemo(
      () => getTransactionCategories(transactionList),
      [transactionList]
    )
    const creators = useMemo(
      () => getTransactionCreators(transactionList),
      [transactionList]
    )
    const activeFilterCount = getActiveFilterCount(appliedFilters, householdType)

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
      setDraftFilters(appliedFilters)
      setFiltersVisible(true)
    }

    function applyFilters() {
      setAppliedFilters({
        ...draftFilters,
        creatorId: householdType === "couple" ? draftFilters.creatorId : null,
      })
      setFiltersVisible(false)
    }

    function requestDelete(transaction: Transaction) {
      const queryKey = ["transactions", selectedHouseholdId] as const
      const previous = queryClient.getQueryData<Transaction[]>(queryKey)
      queryClient.setQueryData<Transaction[]>(
        queryKey,
        (current) => current?.filter((item) => item.id !== transaction.id),
      )

      const restore = () => queryClient.setQueryData(queryKey, previous)
      showUndo({
        message: "Eliminaste el movimiento",
        actionLabel: "Deshacer",
        onAction: restore,
        onExpire: async () => {
          try {
            await deleteMutation.mutateAsync(transaction.id)
          } catch (error) {
            restore()
            showUndo({
              message: isFixedExpenseDeleteError(error)
                ? "Ese movimiento es de un gasto fijo. Gestionarlo desde Gastos fijos."
                : "No se pudo eliminar el movimiento.",
            })
          }
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
          <Text style={styles.empty}>No se pudieron cargar los movimientos.</Text>
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
                void openCreateTransaction()
              }}
              onClearFilters={() => {
                setAppliedFilters(defaultTransactionFilters)
                setDraftFilters(defaultTransactionFilters)
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
        <TransactionFiltersModal
          visible={filtersVisible}
          filters={draftFilters}
          householdType={householdType}
          categories={categories}
          creators={creators}
          onChange={setDraftFilters}
          onClear={() => setDraftFilters(defaultTransactionFilters)}
          onApply={applyFilters}
          onCancel={() => setFiltersVisible(false)}
        />
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
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 12,
    },
  
    empty: {
      textAlign: "center",
      marginTop: 40,
      color: colors.mutedForeground,
      fontFamily: fonts.sans,
    },
  })
