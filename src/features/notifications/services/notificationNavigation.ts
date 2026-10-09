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

type PendingNavigation =
  | { kind: "fixed_expense"; data: FixedExpenseNotificationData }
  | { kind: "pending_charge"; chargeId: string }

let pendingNavigation: PendingNavigation | null = null

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  currentUserId: string,
) {
  const data = response.notification.request.content.data
  if (isFixedExpenseNotificationData(data)) {
    if (data.userId !== currentUserId) return
    pendingNavigation = { kind: "fixed_expense", data }
  } else if (isPendingChargeNotificationData(data)) {
    if (data.userId !== currentUserId) return
    pendingNavigation = { kind: "pending_charge", chargeId: data.chargeId }
  } else {
    return
  }

  flushPendingNotificationNavigation()
}

export function flushPendingNotificationNavigation() {
  if (!pendingNavigation || !navigationRef.isReady()) {
    return
  }

  const pending = pendingNavigation
  pendingNavigation = null

  if (pending.kind === "pending_charge") {
    navigationRef.navigate("PendingCharge", { chargeId: pending.chargeId })
    return
  }

  const data = pending.data
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
  value: unknown,
): value is FixedExpenseNotificationData {
  if (!isRecord(value)) return false
  return value.type === "fixed_expense" && typeof value.userId === "string"
}

function isPendingChargeNotificationData(
  value: unknown,
): value is { type: "pending_charge"; chargeId: string; userId: string } {
  if (!isRecord(value)) return false
  return value.type === "pending_charge"
    && typeof value.chargeId === "string"
    && value.chargeId.length > 0
    && typeof value.userId === "string"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
