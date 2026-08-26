import { AppState } from "react-native"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { useAuth } from "../../auth/context/AuthContext"
import { useHouseholdStore } from "../../../store/householdStore"
import { useFixedExpenses } from "./useFixedExpenses"
import { useFixedExpensePeriods } from "./useFixedExpensePeriods"
import { syncFixedExpenseNotifications } from "../services/fixedExpenseNotificationService"
import {
  getNotificationPermissionStatus,
} from "../../notifications/services/notificationPermissionService"

export function useFixedExpenseNotificationSync() {
  const { user } = useAuth()
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )
  const queryClient = useQueryClient()
  const fixedExpensesQuery = useFixedExpenses()
  const periodsQuery = useFixedExpensePeriods(
    fixedExpensesQuery.data !== undefined && fixedExpensesQuery.data.length > 0
  )
  const permissionQuery = useQuery({
    queryKey: ["notification-permission"],
    queryFn: getNotificationPermissionStatus,
  })

  useEffect(() => {
    if (
      !user ||
      !householdId ||
      !permissionQuery.data?.granted ||
      fixedExpensesQuery.data === undefined ||
      (fixedExpensesQuery.data.length > 0 && periodsQuery.data === undefined)
    ) {
      return
    }

    void syncFixedExpenseNotifications({
      userId: user.id,
      householdId,
      periods: periodsQuery.data ?? [],
      fixedExpenses: fixedExpensesQuery.data,
    }).catch((error) => {
      if (__DEV__) {
        console.error("[Notifications] sync error", error)
      }
    })
  }, [
    fixedExpensesQuery.data,
    householdId,
    permissionQuery.data?.granted,
    periodsQuery.data,
    user,
  ])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !householdId) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: ["fixed-expenses", householdId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["fixed-expense-periods", householdId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["notification-permission"],
      })
    })

    return () => subscription.remove()
  }, [householdId, queryClient])
}
