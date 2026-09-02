import { supabase } from "../../../services/supabase"

import type {
  FixedExpense,
  FixedExpenseInput,
  FixedExpensePeriod,
  FixedExpensePeriodStatus,
} from "../types"

export async function getFixedExpenses(
  householdId: string
): Promise<FixedExpense[]> {
  if (__DEV__) {
    console.log("[FixedExpenses] request", {
      householdId,
      source: "fixed_expenses",
    })
  }

  const { data, error } = await supabase
    .from("fixed_expenses")
    .select(`
      *,
      category:categories (
        id,
        name,
        icon
      )
    `)
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("due_day", { ascending: true })
    .order("name", { ascending: true })

  if (__DEV__) {
    console.log("[FixedExpenses] data", data)
    console.log("[FixedExpenses] error", error)
  }

  if (error) {
    throw error
  }

  return (data ?? []).map(parseFixedExpense)
}

export async function createFixedExpense(
  householdId: string,
  input: FixedExpenseInput
) {
  const { data, error } = await supabase.rpc(
    "create_fixed_expense_with_activity",
    {
      p_household_id: householdId,
      p_category_id: input.categoryId,
      p_name: input.name,
      p_amount: input.amount,
      p_charge_day: input.chargeDay,
      p_due_day: input.dueDay,
    }
  )

  if (error) {
    throw error
  }

  return parseFixedExpense(data)
}

export async function getFixedExpensePeriods(
  householdId: string,
  period: string
): Promise<FixedExpensePeriod[]> {
  if (__DEV__) {
    console.log("[FixedExpenses] request", {
      householdId,
      period,
      source: "get_fixed_expense_periods",
    })
  }

  const { data, error } = await supabase.rpc(
    "get_fixed_expense_periods",
    {
      p_household_id: householdId,
      p_period: period,
    }
  )

  if (__DEV__) {
    console.log("[FixedExpenses] householdId", householdId)
    console.log("[FixedExpenses] period", period)
    console.log("[FixedExpenses] data", data)
    console.log("[FixedExpenses] error", error)
  }

  if (error) {
    throw error
  }

  return Array.isArray(data) ? data.map(parseFixedExpensePeriod) : []
}

export async function payFixedExpensePeriod(
  periodId: string,
  amount: number
) {
  const { data, error } = await supabase.rpc(
    "pay_fixed_expense_period",
    {
      p_period_id: periodId,
      p_amount: amount,
    }
  )

  if (error) {
    throw error
  }

  return data
}

export async function updateFixedExpensePayment(
  paymentId: string,
  amount: number
) {
  const { data, error } = await supabase.rpc(
    "update_fixed_expense_payment_with_activity",
    {
      p_payment_id: paymentId,
      p_amount: amount,
    }
  )

  if (error) {
    throw error
  }

  return data
}

export async function updateFixedExpense(
  fixedExpenseId: string,
  input: FixedExpenseInput,
  period: string
) {
  if (__DEV__) {
    console.log("[FixedExpenses] update", { fixedExpenseId, period })
  }

  const { data, error } = await supabase.rpc(
    "update_fixed_expense_with_activity",
    {
      p_fixed_expense_id: fixedExpenseId,
      p_period: period,
      p_name: input.name,
      p_amount: input.amount,
      p_category_id: input.categoryId,
      p_charge_day: input.chargeDay,
      p_due_day: input.dueDay,
      p_is_active: input.isActive ?? true,
    }
  )

  if (error) {
    throw error
  }

  return parseFixedExpense(data)
}

export async function deleteFixedExpense(fixedExpenseId: string) {
  const { data, error } = await supabase.rpc(
    "delete_fixed_expense_with_activity",
    { p_fixed_expense_id: fixedExpenseId }
  )

  if (error) {
    throw error
  }
}

function parseFixedExpense(value: unknown): FixedExpense {
  if (!isRecord(value)) {
    throw new Error("La API devolvió un gasto fijo inválido.")
  }

  const fixedExpense = {
    id: getString(value.id),
    household_id: getString(value.household_id),
    created_by: getString(value.created_by),
    category_id: getString(value.category_id),
    name: getString(value.name),
    amount: getNumber(value.amount),
    charge_day: getNumber(value.charge_day),
    due_day: getNumber(value.due_day),
    is_active: typeof value.is_active === "boolean"
      ? value.is_active
      : null,
    created_at: getString(value.created_at),
    updated_at: getString(value.updated_at),
    category: parseCategory(value.category),
  }

  if (
    !fixedExpense.id ||
    !fixedExpense.household_id ||
    !fixedExpense.created_by ||
    !fixedExpense.category_id ||
    !fixedExpense.name ||
    fixedExpense.amount === null ||
    fixedExpense.charge_day === null ||
    fixedExpense.due_day === null ||
    fixedExpense.is_active === null ||
    !fixedExpense.created_at ||
    !fixedExpense.updated_at
  ) {
    throw new Error("La API devolvió un gasto fijo incompleto.")
  }

  return fixedExpense as FixedExpense
}

function parseCategory(value: unknown): FixedExpense["category"] {
  if (!isRecord(value)) {
    return null
  }

  const id = getString(value.id)
  const name = getString(value.name)

  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    icon: typeof value.icon === "string" ? value.icon : null,
  }
}

function parseFixedExpensePeriod(value: unknown): FixedExpensePeriod {
  if (!isRecord(value)) {
    throw new Error("La API devolvió un período inválido.")
  }

  const period = {
    id: getString(value.id),
    fixedExpenseId: getString(value.fixedExpenseId),
    householdId: getString(value.householdId),
    period: getString(value.period),
    name: getString(value.name),
    categoryId: getString(value.categoryId),
    expectedAmount: getNumber(value.expectedAmount),
    totalPaid: getNumber(value.totalPaid),
    remaining: getNumber(value.remaining),
    chargeDate: getString(value.chargeDate),
    dueDate: getString(value.dueDate),
    status: parseStatus(value.status),
    category: parseCategory(value.category),
    lastPayment: parseLastPayment(value.lastPayment),
  }

  if (
    !period.id ||
    !period.fixedExpenseId ||
    !period.householdId ||
    !period.period ||
    !period.name ||
    !period.categoryId ||
    period.expectedAmount === null ||
    period.totalPaid === null ||
    period.remaining === null ||
    !period.chargeDate ||
    !period.dueDate ||
    !period.status
  ) {
    throw new Error("La API devolvió un período incompleto.")
  }

  return period as FixedExpensePeriod
}

function parseLastPayment(value: unknown): FixedExpensePeriod["lastPayment"] {
  if (!isRecord(value)) {
    return null
  }

  const payment = {
    id: getString(value.id),
    amount: getNumber(value.amount),
    paidAt: getString(value.paidAt),
  }

  if (!payment.id || payment.amount === null || !payment.paidAt) {
    return null
  }

  return payment as FixedExpensePeriod["lastPayment"]
}

function parseStatus(value: unknown): FixedExpensePeriodStatus | null {
  if (
    value === "upcoming" ||
    value === "pending" ||
    value === "partial" ||
    value === "paid" ||
    value === "overdue"
  ) {
    return value
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getString(value: unknown) {
  return typeof value === "string" && value.length ? value : null
}

function getNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}
