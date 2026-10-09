import type { QueryClient } from "@tanstack/react-query"

const HOUSEHOLD_QUERY_KEYS = [
  "transactions",
  "dashboard",
  "dashboard-insights",
  "budgets",
  "activity",
] as const

export function invalidatePendingCharges(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["pending-charges"] })
}

export function invalidateHouseholdTransactionQueries(
  queryClient: QueryClient,
  householdId: string,
) {
  for (const key of HOUSEHOLD_QUERY_KEYS) {
    void queryClient.invalidateQueries({ queryKey: [key, householdId] })
  }
}
