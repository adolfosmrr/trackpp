import { useHouseholdStore } from "../../../store/householdStore"
import { formatMoney } from "../../../utils/formatMoney"
import { useHouseholds } from "./useHouseholds"

function useSpaceCurrency() {
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const { data: memberships } = useHouseholds()
  return memberships?.find(
    (membership) => membership.household.id === selectedHouseholdId,
  )?.household.currency ?? "ARS"
}

export function useFormatMoney() {
  const currency = useSpaceCurrency()
  return (amount: number) => formatMoney(amount, currency)
}
