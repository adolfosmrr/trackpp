import { useQuery } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { getHomeAiInsight } from "../../dashboard/services/homeAiInsightService"

export function useHomeAiInsight() {
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useQuery({
    queryKey: ["home-ai-insight", selectedHouseholdId],
    queryFn: () => getHomeAiInsight(selectedHouseholdId!),
    enabled: Boolean(selectedHouseholdId),
  })
}
