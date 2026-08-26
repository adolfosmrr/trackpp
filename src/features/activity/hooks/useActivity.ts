import { useQuery } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"

import { getHouseholdActivity } from "../services/activityService"

export function useActivity(enabled = true) {
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useQuery({
    queryKey: [
      "activity",
      selectedHouseholdId,
    ],
    queryFn: () => getHouseholdActivity(selectedHouseholdId!),
    enabled: enabled && !!selectedHouseholdId,
  })
}
