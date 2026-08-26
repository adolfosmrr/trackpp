import AsyncStorage from "@react-native-async-storage/async-storage"

export type FixedExpenseNotificationType =
  | "charge_in_5_days"
  | "charge_tomorrow"
  | "charge_today"
  | "due_in_3_days"
  | "due_tomorrow"
  | "due_today"

export type ScheduledFixedExpenseNotification = {
  notificationId: string
  logicalKey: string
  householdId: string
  fixedExpensePeriodId?: string
  fixedExpenseId: string
  targetPeriod: string
  reminderType: FixedExpenseNotificationType
  triggerAt: string
  body: string
}

const STORAGE_PREFIX = "fixed-expense-notifications:v1:"

export async function loadScheduledFixedExpenseNotifications(userId: string) {
  const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${userId}`)

  if (!raw) {
    return []
  }

  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value)
      ? value.filter(isScheduledNotification)
      : []
  } catch {
    return []
  }
}

export async function saveScheduledFixedExpenseNotifications(
  userId: string,
  notifications: ScheduledFixedExpenseNotification[]
) {
  await AsyncStorage.setItem(
    `${STORAGE_PREFIX}${userId}`,
    JSON.stringify(notifications)
  )
}

function isScheduledNotification(value: unknown): value is ScheduledFixedExpenseNotification {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const item = value as Record<string, unknown>
  return typeof item.notificationId === "string" &&
    typeof item.logicalKey === "string" &&
    typeof item.householdId === "string" &&
    typeof item.fixedExpenseId === "string" &&
    typeof item.targetPeriod === "string" &&
    typeof item.reminderType === "string" &&
    typeof item.triggerAt === "string" &&
    typeof item.body === "string"
}
