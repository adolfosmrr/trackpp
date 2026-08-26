import { useIsFocused } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { useHouseholdStore } from "../../../store/householdStore"
import { getFixedExpenseReminders } from "../services/fixedExpenseReminderService"

export function useFixedExpenseReminders() {
  const householdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )
  const isFocused = useIsFocused()
  const query = useQuery({
    queryKey: ["fixed-expense-reminders", householdId],
    queryFn: () => getFixedExpenseReminders(householdId!),
    enabled: Boolean(householdId),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (isFocused && householdId && query.data !== undefined) {
      void query.refetch()
    }
  }, [householdId, isFocused, query.data, query.refetch])

  useEffect(() => {
    if (__DEV__ && query.error) {
      console.error("[FixedExpenseReminders] error", query.error)
    }
  }, [query.error])

  return query
}
