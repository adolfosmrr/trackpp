import { useQuery } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { getAiConversations } from "../services/aiService"

export function useAiConversations() {
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useQuery({
    queryKey: ["ai-conversations", householdId],
    queryFn: () => getAiConversations(householdId!),
    enabled: Boolean(householdId),
  })
}
