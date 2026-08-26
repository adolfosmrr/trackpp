import { useQuery } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { getTransactions } from "../services/transactionService"

export function useTransactions() {
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  return useQuery({
    queryKey: [
      "transactions",
      selectedHouseholdId,
    ],

    queryFn: () =>
      getTransactions(selectedHouseholdId!),

    enabled: !!selectedHouseholdId,
  })
}