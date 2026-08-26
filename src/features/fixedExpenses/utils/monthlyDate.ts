export function resolveMonthlyDay(
  year: number,
  month: number,
  day: number
) {
  const lastDay = new Date(year, month, 0).getDate()
  const resolvedDay = Math.min(Math.max(day, 1), lastDay)

  return new Date(year, month - 1, resolvedDay)
}
