import { apiFetch } from "../../../services/api"

import type { FixedExpenseReminder } from "../types/reminders"

export async function getFixedExpenseReminders(
  householdId: string
): Promise<FixedExpenseReminder[]> {
  if (__DEV__) {
    console.log("[FixedExpenseReminders] householdId", householdId)
  }

  const response = await apiFetch<{
    reminders: FixedExpenseReminder[]
  }>(
    `/dashboard/fixed-expense-reminders?householdId=${encodeURIComponent(householdId)}`
  )

  if (__DEV__) {
    console.log("[FixedExpenseReminders] count", response.reminders.length)
  }

  return response.reminders
}
