import { useQuery } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { getDashboardInsights } from "../services/dashboardInsightsService"

export function useDashboardInsights() {
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useQuery({
    queryKey: ["dashboard-insights", householdId],
    queryFn: () => getDashboardInsights(householdId!),
    enabled: Boolean(householdId),
  })
}
