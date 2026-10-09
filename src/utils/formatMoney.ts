const amountFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** `$0` with no space. Grouping follows es-AR; cents show only when the amount has them. */
export function formatMoney(amount: number) {
  const formatted = amountFormatter.format(Math.abs(amount))
  return amount < 0 ? `-$${formatted}` : `$${formatted}`
}
