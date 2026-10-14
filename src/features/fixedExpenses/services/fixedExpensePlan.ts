import AsyncStorage from "@react-native-async-storage/async-storage"
import type { PostgrestError } from "@supabase/supabase-js"

import { supabase } from "../../../services/supabase"
import type { FixedExpense } from "../types"
import {
  normalizeChargeReminderDays,
  normalizeStartReminderDays,
} from "../utils/reminders"

export type FixedExpensePlan = {
  startsOn: string | null
  endsOn: string | null
  chargeReminderDays: number[] | null
  startReminderDays: number[]
}

const STORAGE_PREFIX = "fixed-expense-plans:v1:"

export function expenseHasScheduleColumns(expense: FixedExpense) {
  return "starts_on" in expense
    || "ends_on" in expense
    || "charge_reminder_days" in expense
    || "start_reminder_days" in expense
}

export function planFromExpense(
  expense: FixedExpense,
  local: FixedExpensePlan | undefined,
): FixedExpensePlan {
  if (expenseHasScheduleColumns(expense)) {
    return {
      startsOn: expense.starts_on ?? null,
      endsOn: expense.ends_on ?? null,
      chargeReminderDays: expense.charge_reminder_days === undefined
        ? null
        : expense.charge_reminder_days === null
          ? null
          : normalizeChargeReminderDays(expense.charge_reminder_days),
      startReminderDays: normalizeStartReminderDays(expense.start_reminder_days ?? []),
    }
  }

  if (local) return normalizePlan(local)

  return {
    startsOn: null,
    endsOn: null,
    chargeReminderDays: null,
    startReminderDays: [],
  }
}

export async function loadFixedExpensePlans(userId: string) {
  const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${userId}`)
  if (!raw) return {}

  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value)) return {}
    const plans: Record<string, FixedExpensePlan> = {}
    for (const [expenseId, plan] of Object.entries(value)) {
      if (isPlan(plan)) plans[expenseId] = normalizePlan(plan)
    }
    return plans
  } catch {
    return {}
  }
}

export async function loadFixedExpensePlan(userId: string, expenseId: string) {
  const plans = await loadFixedExpensePlans(userId)
  return plans[expenseId]
}

export async function persistFixedExpensePlan(
  userId: string,
  expenseId: string,
  plan: FixedExpensePlan,
) {
  const normalized = normalizePlan(plan)
  const plans = await loadFixedExpensePlans(userId)
  plans[expenseId] = normalized
  await AsyncStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(plans))

  const { error } = await supabase.rpc("save_fixed_expense_plan", {
    p_fixed_expense_id: expenseId,
    p_starts_on: normalized.startsOn,
    p_ends_on: normalized.endsOn,
    p_charge_reminder_days: normalized.chargeReminderDays,
    p_start_reminder_days: normalized.startReminderDays,
  })

  if (error && !isMissingPlanFunction(error)) {
    throw error
  }
}

function normalizePlan(plan: FixedExpensePlan): FixedExpensePlan {
  return {
    startsOn: plan.startsOn,
    endsOn: plan.endsOn,
    chargeReminderDays: plan.chargeReminderDays === null
      ? null
      : normalizeChargeReminderDays(plan.chargeReminderDays),
    startReminderDays: normalizeStartReminderDays(plan.startReminderDays),
  }
}

function isMissingPlanFunction(error: PostgrestError) {
  const message = error.message.toLowerCase()
  return error.code === "PGRST202"
    || error.code === "42883"
    || message.includes("save_fixed_expense_plan")
    || message.includes("could not find the function")
    || message.includes("does not exist")
}

function isPlan(value: unknown): value is FixedExpensePlan {
  if (!isRecord(value)) return false
  const charge = value.chargeReminderDays
  const start = value.startReminderDays
  return (value.startsOn === null || typeof value.startsOn === "string")
    && (value.endsOn === null || typeof value.endsOn === "string")
    && (charge === null || isNumberList(charge))
    && isNumberList(start)
}

function isNumberList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
