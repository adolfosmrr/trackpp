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

export function planFromExpense(expense: FixedExpense): FixedExpensePlan {
  return {
    startsOn: expense.starts_on,
    endsOn: expense.ends_on,
    chargeReminderDays: expense.charge_reminder_days === null
      ? null
      : normalizeChargeReminderDays(expense.charge_reminder_days),
    startReminderDays: normalizeStartReminderDays(expense.start_reminder_days),
  }
}

export async function persistFixedExpensePlan(
  expenseId: string,
  plan: FixedExpensePlan,
) {
  const normalized = normalizePlan(plan)
  const { error } = await supabase.rpc("save_fixed_expense_plan", {
    p_fixed_expense_id: expenseId,
    p_starts_on: normalized.startsOn,
    p_ends_on: normalized.endsOn,
    p_charge_reminder_days: normalized.chargeReminderDays,
    p_start_reminder_days: normalized.startReminderDays,
  })

  if (error) throw error
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
