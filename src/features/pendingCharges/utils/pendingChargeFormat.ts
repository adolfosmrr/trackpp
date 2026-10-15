import { currencyCode } from "../../../utils/formatMoney"
import { parseLocalDate } from "../../../utils/localDate"
import type { BankChargeSource, PendingBankCharge } from "../types"

function sourceLabel(source: BankChargeSource) {
  switch (source) {
    case "naranja":
      return "Naranja"
    case "naranjax":
      return "Naranja X"
    case "galicia":
      return "Banco Galicia"
    default:
      return "Tarjeta"
  }
}

export function chargeOrigin(charge: Pick<PendingBankCharge, "source" | "card_last4">) {
  const label = sourceLabel(charge.source)
  return charge.card_last4 ? `${label} · ****${charge.card_last4}` : label
}

export function chargeTitle(charge: Pick<PendingBankCharge, "merchant">) {
  return charge.merchant?.trim() || "Gasto con tarjeta"
}

export function formatChargeDate(value: string | null) {
  if (!value) return null
  const parsed = parseLocalDate(value)
  if (!parsed) return value
  const day = String(parsed.getDate()).padStart(2, "0")
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${parsed.getFullYear()}`
}

export function currenciesMatch(
  householdCurrency: string | null | undefined,
  chargeCurrency: string,
) {
  return currencyCode(householdCurrency) === currencyCode(chargeCurrency)
}
