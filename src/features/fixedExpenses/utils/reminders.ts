export const CHARGE_REMINDER_PRESETS = [
  { days: 0, label: "El mismo día" },
  { days: 1, label: "1 día antes" },
  { days: 3, label: "3 días antes" },
  { days: 7, label: "1 semana antes" },
] as const

export const START_REMINDER_PRESETS = [
  { days: 1, label: "1 día antes" },
  { days: 3, label: "3 días antes" },
  { days: 7, label: "1 semana antes" },
] as const

export const LEGACY_CHARGE_REMINDER_DAYS = [0, 1, 5] as const

const CHARGE_DAY_LABELS: Record<number, string> = {
  0: "El mismo día",
  1: "1 día antes",
  3: "3 días antes",
  5: "5 días antes",
  7: "1 semana antes",
}

export function chargeReminderLabel(days: number) {
  return CHARGE_DAY_LABELS[days] ?? `${days} días antes`
}

export function normalizeChargeReminderDays(days: readonly number[]) {
  return uniqueSorted(days.filter((day) => day in CHARGE_DAY_LABELS))
}

export function normalizeStartReminderDays(days: readonly number[]) {
  return uniqueSorted(days.filter((day) => day === 1 || day === 3 || day === 7))
}

export function toDateInputValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseDateInputValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date()
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function formatPlanDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseDateInputValue(value))
}

function uniqueSorted(days: number[]) {
  return [...new Set(days)].sort((left, right) => left - right)
}
