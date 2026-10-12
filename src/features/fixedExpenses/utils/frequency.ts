export type FixedExpenseFrequency =
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannual"
  | "annual"

export type AutoDebitSource = "naranja" | "galicia" | "other"

export const FIXED_EXPENSE_FREQUENCIES: readonly {
  value: FixedExpenseFrequency
  label: string
}[] = [
  { value: "monthly", label: "Mensual" },
  { value: "bimonthly", label: "Bimestral" },
  { value: "quarterly", label: "Trimestral" },
  { value: "semiannual", label: "Semestral" },
  { value: "annual", label: "Anual" },
]

export const AUTO_DEBIT_SOURCES: readonly {
  value: AutoDebitSource
  label: string
}[] = [
  { value: "naranja", label: "Naranja" },
  { value: "galicia", label: "Galicia" },
  { value: "other", label: "Otra" },
]

export function isFixedExpenseFrequency(
  value: unknown,
): value is FixedExpenseFrequency {
  return FIXED_EXPENSE_FREQUENCIES.some((option) => option.value === value)
}

export function isAutoDebitSource(value: unknown): value is AutoDebitSource {
  return AUTO_DEBIT_SOURCES.some((option) => option.value === value)
}

export function frequencyLabel(frequency: FixedExpenseFrequency) {
  return FIXED_EXPENSE_FREQUENCIES.find((option) => option.value === frequency)?.label
    ?? "Mensual"
}

export function autoDebitSourceLabel(source: AutoDebitSource) {
  return AUTO_DEBIT_SOURCES.find((option) => option.value === source)?.label ?? "Otra"
}

export function formatPeriodLabel(period: string) {
  const match = /^(\d{4})-(\d{2})-\d{2}/.exec(period)
  if (!match) return period
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1)
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(date)
  return label.charAt(0).toLocaleUpperCase("es-AR") + label.slice(1)
}

export function upcomingAmountPeriods(
  createdAt: string,
  frequency: FixedExpenseFrequency,
  count = 4,
) {
  const today = new Date()
  const start = Math.max(
    monthIndex(today.getFullYear(), today.getMonth() + 1),
    anchorMonthIndex(createdAt),
  )
  const periods: string[] = []

  for (let step = 0; periods.length < count && step < 36; step += 1) {
    const index = start + step
    const { year, month } = fromMonthIndex(index)
    if (periodApplies(createdAt, frequency, year, month)) {
      periods.push(periodString(year, month))
    }
  }

  return periods
}

export function nextReminderPeriod(
  createdAt: string,
  frequency: FixedExpenseFrequency,
  fromYear: number,
  fromMonth: number,
  includeFrom: boolean,
) {
  let index = monthIndex(fromYear, fromMonth)
  if (!includeFrom) index += 1
  const anchor = anchorMonthIndex(createdAt)
  if (index < anchor) index = anchor

  for (let step = 0; step < 36; step += 1) {
    const { year, month } = fromMonthIndex(index + step)
    if (periodApplies(createdAt, frequency, year, month)) {
      return { year, month, period: periodString(year, month) }
    }
  }

  return null
}

function periodApplies(
  createdAt: string,
  frequency: FixedExpenseFrequency,
  year: number,
  month: number,
) {
  const anchor = anchorMonthIndex(createdAt)
  const target = monthIndex(year, month)
  if (target < anchor) return false
  return (target - anchor) % frequencyStep(frequency) === 0
}

function frequencyStep(frequency: FixedExpenseFrequency) {
  switch (frequency) {
    case "monthly":
      return 1
    case "bimonthly":
      return 2
    case "quarterly":
      return 3
    case "semiannual":
      return 6
    case "annual":
      return 12
  }
}

function anchorMonthIndex(createdAt: string) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return monthIndex(1970, 1)
  return monthIndex(date.getUTCFullYear(), date.getUTCMonth() + 1)
}

function monthIndex(year: number, month: number) {
  return year * 12 + (month - 1)
}

function fromMonthIndex(index: number) {
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  }
}

function periodString(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}-01`
}
