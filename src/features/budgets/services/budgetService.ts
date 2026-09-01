import { supabase } from "../../../services/supabase"

import type {
  Budget,
  BudgetWithProgress,
  CreateBudgetInput,
} from "../types"

export async function getBudgets(
  householdId: string,
  month: string
): Promise<BudgetWithProgress[]> {
  const nextMonth = getNextMonth(month)

  await ensureBudgetSnapshots(householdId, month)

  const { data: budgetsData, error: budgetsError } =
    await supabase
      .from("budgets")
      .select(`
        *,
        category:categories (
          id,
          name,
          icon
        )
      `)
      .eq("household_id", householdId)
      .eq("month", month)
      .order("created_at", {
        ascending: true,
      })

  if (budgetsError) {
    throw budgetsError
  }

  const budgets = budgetsData as Budget[]

  const { data: transactionsData, error: transactionsError } =
    await supabase
      .from("transactions")
      .select(`
        amount,
        category_id
      `)
      .eq("household_id", householdId)
      .eq("type", "expense")
      .gte("transaction_date", month)
      .lt("transaction_date", nextMonth)

  if (transactionsError) {
    throw transactionsError
  }

  return budgets.map((budget) => {
    const spent = transactionsData
      .filter(
        (transaction) =>
          transaction.category_id === budget.category_id
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      )

    const amount = Number(budget.amount)

    const remaining = amount - spent

    const percentage =
      amount > 0
        ? (spent / amount) * 100
        : 0

    const progressPercentage = Math.min(
      percentage,
      100
    )

    return {
      ...budget,
      amount,
      spent,
      remaining,
      percentage,
      progressPercentage,
    }
  })
}

export async function ensureBudgetSnapshots(
  householdId: string,
  month: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "ensure_budget_snapshots",
    {
      p_household_id: householdId,
      p_month: month,
    }
  )

  if (error) {
    throw error
  }
}

export async function createBudget(
  input: CreateBudgetInput
): Promise<Budget> {
  if (__DEV__) {
    console.log("[Budget] create input:", {
      householdId: input.householdId,
      categoryId: input.categoryId,
      name: input.name,
      amount: input.amount,
      month: input.month,
    })
  }

  const { data, error } = await supabase.rpc(
    "create_budget_with_activity",
    {
      p_household_id: input.householdId,
      p_category_id: input.categoryId,
      p_name: input.name,
      p_amount: input.amount,
      p_month: input.month,
    }
  )

  if (error) {
    console.error(
      "[Budget] create_budget_with_activity error:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    )
    throw error
  }

  if (__DEV__) {
    console.log("[Budget] create_budget_with_activity data:", data)
  }

  return parseBudgetRpcResult(data)
}

function parseBudgetRpcResult(value: unknown): Budget {
  if (!isRecord(value)) {
    throw new Error("La RPC devolvió un presupuesto inválido.")
  }

  const id = getString(value.id)
  const householdId = getString(value.household_id)
  const categoryId = getString(value.category_id)
  const name = getString(value.name)
  const createdBy = getString(value.created_by)
  const month = getString(value.month)
  const createdAt = getString(value.created_at)
  const updatedAt = getString(value.updated_at)
  const amount = getNumber(value.amount)
  const category = parseBudgetCategory(value.category)

  if (
    !id ||
    !householdId ||
    !categoryId ||
    !name ||
    !createdBy ||
    !month ||
    !createdAt ||
    !updatedAt ||
    amount === null ||
    !category
  ) {
    throw new Error("La RPC devolvió un presupuesto incompleto.")
  }

  return {
    id,
    household_id: householdId,
    category_id: categoryId,
    name,
    created_by: createdBy,
    amount,
    month,
    created_at: createdAt,
    updated_at: updatedAt,
    category,
  }
}

function parseBudgetCategory(
  value: unknown
): Budget["category"] | null {
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
    icon: value.icon === null ? null : getString(value.icon),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null
}

function getNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

function getNextMonth(month: string) {
  const [year, monthNumber] = month
    .split("-")
    .map(Number)

  const date = new Date(
    year,
    monthNumber,
    1
  )

  const nextYear = date.getFullYear()

  const nextMonthNumber = String(
    date.getMonth() + 1
  ).padStart(2, "0")

  return `${nextYear}-${nextMonthNumber}-01`
}

export async function updateBudget(
  budgetId: string,
  amount: number,
  month: string,
  name: string
): Promise<Budget> {
  const { data, error } = await supabase.rpc(
    "update_budget_with_activity",
    {
      p_budget_id: budgetId,
      p_amount: amount,
      p_month: month,
      p_name: name,
    }
  )

  if (error) {
    throw error
  }

  return parseBudgetRpcResult(data)
}
  
export async function deleteBudget(
  budgetId: string,
  month: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "delete_budget_with_activity",
    {
      p_budget_id: budgetId,
      p_month: month,
    }
  )

  if (error) {
    throw error
  }
}
