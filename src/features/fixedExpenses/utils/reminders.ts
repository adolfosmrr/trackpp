import { parseLocalDate } from "../../../utils/localDate"

const CHARGE_DAY_LABELS: Record<number, string> = {
  0: "El mismo día",
  1: "1 día antes",
  3: "3 días antes",
  5: "5 días antes",
  7: "1 semana antes",
}

function reminderPreset(days: number) {
  return { days, label: CHARGE_DAY_LABELS[days] ?? `${days} días antes` }
}

export const CHARGE_REMINDER_PRESETS = [0, 1, 3, 7].map(reminderPreset)

export const START_REMINDER_PRESETS = [1, 3, 7].map(reminderPreset)

export const LEGACY_CHARGE_REMINDER_DAYS = [0, 1, 5] as const

export function chargeReminderLabel(days: number) {
  return CHARGE_DAY_LABELS[days] ?? `${days} días antes`
}

export function normalizeChargeReminderDays(days: readonly number[]) {
  return uniqueSorted(days.filter((day) => day in CHARGE_DAY_LABELS))
}

export function normalizeStartReminderDays(days: readonly number[]) {
  return uniqueSorted(days.filter((day) => day === 1 || day === 3 || day === 7))
}

export function parseDateInputValue(value: string) {
  return parseLocalDate(value) ?? new Date()
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
