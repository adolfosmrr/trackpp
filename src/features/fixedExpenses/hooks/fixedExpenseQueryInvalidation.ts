import type { QueryClient } from "@tanstack/react-query"

import { getCurrentFixedExpensePeriod } from "./useFixedExpensePeriods"

export function invalidateFixedExpenseQueries(
  queryClient: QueryClient,
  householdId: string | null
) {
  if (!householdId) return

  const period = getCurrentFixedExpensePeriod()
  const keys = [
    ["fixed-expense-periods", householdId, period],
    ["fixed-expenses", householdId],
    ["fixed-expense-reminders", householdId],
    ["transactions", householdId],
    ["dashboard", householdId],
    ["budgets", householdId],
    ["dashboard-insights", householdId],
    ["activity", householdId],
  ]

  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey })
  }
}
