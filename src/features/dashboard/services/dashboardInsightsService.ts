import { apiFetch } from "../../../services/api"

import type { FinancialInsight } from "../types/insights"

export async function getDashboardInsights(
  householdId: string
): Promise<FinancialInsight[]> {
  const response = await apiFetch<{ insights: FinancialInsight[] }>(
    `/dashboard/insights?householdId=${encodeURIComponent(householdId)}`
  )

  return response.insights
}
