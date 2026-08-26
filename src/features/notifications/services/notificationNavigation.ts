import * as Notifications from "expo-notifications"

import { navigationRef } from "../../../navigation/navigationRef"
import { useHouseholdStore } from "../../../store/householdStore"

type FixedExpenseNotificationData = {
  type: "fixed_expense"
  userId: string
  fixedExpensePeriodId?: string
  fixedExpenseId?: string
  householdId?: string
  targetPeriod?: string
}

let pendingData: FixedExpenseNotificationData | null = null

export function handleFixedExpenseNotificationResponse(
  response: Notifications.NotificationResponse,
  currentUserId: string
) {
  const data = response.notification.request.content.data
  if (!isFixedExpenseNotificationData(data) || data.userId !== currentUserId) {
    return
  }

  pendingData = data
  flushPendingNotificationNavigation()
}

export function flushPendingNotificationNavigation() {
  if (!pendingData || !navigationRef.isReady()) {
    return
  }

  const data = pendingData
  pendingData = null

  if (data.householdId) {
    useHouseholdStore.getState().setSelectedHouseholdId(data.householdId)
  }

  if (data.fixedExpensePeriodId) {
    navigationRef.navigate("PayFixedExpensePeriod", {
      periodId: data.fixedExpensePeriodId,
    })
  } else {
    navigationRef.navigate("FixedExpenses")
  }
}

function isFixedExpenseNotificationData(
  value: unknown
): value is FixedExpenseNotificationData {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const data = value as Record<string, unknown>
  return data.type === "fixed_expense" && typeof data.userId === "string"
}
