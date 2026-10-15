import { useHouseholdStore } from "../../../store/householdStore"
import { currencyCode, formatMoney } from "../../../utils/formatMoney"
import { useHouseholds } from "./useHouseholds"

function useSpaceCurrency() {
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const { data: memberships } = useHouseholds()
  return currencyCode(
    memberships?.find(
      (membership) => membership.household.id === selectedHouseholdId,
    )?.household.currency,
  )
}

export function useFormatMoney() {
  const currency = useSpaceCurrency()
  return (amount: number) => formatMoney(amount, currency)
}
