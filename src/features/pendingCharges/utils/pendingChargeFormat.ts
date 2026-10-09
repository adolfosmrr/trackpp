import { formatMoney } from "../../../utils/formatMoney"

import type { BankChargeSource, PendingBankCharge } from "../types"

export function sourceLabel(source: BankChargeSource) {
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

export function formatChargeAmount(amount: number, _currency?: string) {
  return formatMoney(amount)
}

export function formatChargeDate(value: string | null) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  return `${match[3]}/${match[2]}/${match[1]}`
}

export function currenciesMatch(
  householdCurrency: string | null | undefined,
  chargeCurrency: string,
) {
  const household = (householdCurrency || "ARS").trim().toUpperCase()
  const charge = (chargeCurrency || "ARS").trim().toUpperCase()
  return household === charge
}
