import {
  View,
  Text,
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native"
  import { useState } from "react"

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
  import { FixedExpenseActions } from "../components/FixedExpenseActions"
  import { TransactionsMovementsSection } from "../components/TransactionsMovementsSection"
  import { useTransactions } from "../hooks/useTransactions"
  import { useDeleteTransaction } from "../hooks/useDeleteTransaction"
  import type { Transaction } from "../types"

  export function TransactionsScreen({ navigation }: any) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [topSectionHeight, setTopSectionHeight] = useState(0)
    const deleteMutation = useDeleteTransaction()

    function handleTopSectionLayout(event: LayoutChangeEvent) {
      const height = event.nativeEvent.layout.height
      setTopSectionHeight((current) => current || height)
    }

    const { user } = useAuth()
    const {
      data: profile,
      isLoading: profileLoading,
      error: profileError,
    } = useProfile()
    const {
      data: dashboard,
      isLoading: dashboardLoading,
      error: dashboardError,
    } = useDashboard()
    const selectedHouseholdId = useHouseholdStore(
      (state) => state.selectedHouseholdId
    )
    const { data: memberships } = useHouseholds()
    const currentHousehold = memberships?.find(
      (membership) => membership.household.id === selectedHouseholdId
    )?.household

    const {
      data: transactions,
      isLoading,
      error,
    } = useTransactions()

    function confirmDelete(transaction: Transaction) {
      Alert.alert(
        "¿Eliminar movimiento?",
        `Esta acción eliminará "${transaction.title}".`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              void handleDelete(transaction.id)
            },
          },
        ]
      )
    }

    async function handleDelete(transactionId: string) {
      if (deletingId) {
        return
      }

      setDeletingId(transactionId)

      try {
        await deleteMutation.mutateAsync(transactionId)
      } catch (error) {
        if (__DEV__) {
          console.error("Delete transaction error:", error)
        }

        Alert.alert(
          "Error",
          isFixedExpenseDeleteError(error)
            ? "Este movimiento pertenece a un gasto fijo y debe gestionarse desde Gastos fijos."
            : error instanceof Error
              ? error.message
              : "No se pudo eliminar el movimiento."
        )
      } finally {
        setDeletingId(null)
      }
    }

    if (isLoading || profileLoading || dashboardLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      )
    }
  
    if (error || profileError || dashboardError) {
      return (
        <View style={styles.center}>
          <Text>No se pudieron cargar los movimientos.</Text>
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
          ListHeaderComponent={
            topSectionHeight > 0
              ? (
                <View>
                  <View style={{ height: topSectionHeight }} />
                  <FixedExpenseActions
                    onCreatePress={() => navigation.navigate("CreateFixedExpense")}
                    onViewPress={() => navigation.navigate("FixedExpenses")}
                  />
                </View>
              )
              : null
          }
          renderItem={() => (
            <TransactionsMovementsSection
              transactions={transactions ?? []}
              householdType={currentHousehold?.type === "couple" ? "couple" : "personal"}
              userId={user?.id}
              deletingId={deletingId}
              onDelete={confirmDelete}
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

  const styles = StyleSheet.create({
    screenWrapper: {
      flex: 1,
      position: "relative",
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
      color: "#777",
    },
  })
