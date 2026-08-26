import { useQuery } from "@tanstack/react-query"

import {
  useHouseholdStore,
} from "../../../store/householdStore"

import {
  getDashboard,
} from "../services/dashboardService"

export function useDashboard() {
  const selectedHouseholdId =
    useHouseholdStore(
      (state) =>
        state.selectedHouseholdId
    )

  return useQuery({
    queryKey: [
      "dashboard",
      selectedHouseholdId,
    ],

    queryFn: () =>
      getDashboard(
        selectedHouseholdId!
      ),

    enabled:
      !!selectedHouseholdId,
  })
}