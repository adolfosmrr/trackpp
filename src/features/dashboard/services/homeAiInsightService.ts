import { apiFetch } from "../../../services/api"

import type { HomeAiInsight } from "../types/homeAiInsight"

export async function getHomeAiInsight(
  householdId: string
): Promise<HomeAiInsight> {
  return apiFetch<HomeAiInsight>(
    `/dashboard/home-ai-insight?householdId=${encodeURIComponent(householdId)}`
  )
}
