const amountFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Grouping follows es-AR. Cents show only when the amount has them.
 * ARS keeps `$1.234`. Any other ISO code is prefixed: `USD 1.234`.
 */
export function formatMoney(amount: number, currency = "ARS") {
  const code = currency.trim().toUpperCase() || "ARS"
  const formatted = amountFormatter.format(Math.abs(amount))
  if (code === "ARS") {
    return amount < 0 ? `-$${formatted}` : `$${formatted}`
  }
  return amount < 0 ? `-${code} ${formatted}` : `${code} ${formatted}`
}
