import type { AutoDebitSource, FixedExpenseFrequency } from "./utils/frequency"

export type FixedExpenseCategory = {
  id: string
  name: string
  icon: string | null
}

export type FixedExpense = {
  id: string
  household_id: string
  created_by: string
  category_id: string
  name: string
  amount: number
  charge_day: number
  due_day: number
  frequency: FixedExpenseFrequency
  auto_debit: boolean
  auto_debit_source: AutoDebitSource | null
  is_active: boolean
  created_at: string
  updated_at: string
  category: FixedExpenseCategory | null
}

export type FixedExpenseInput = {
  name: string
  amount: number
  categoryId: string
  chargeDay: number
  dueDay: number
  frequency: FixedExpenseFrequency
  autoDebit: boolean
  autoDebitSource: AutoDebitSource | null
  isActive?: boolean
}

export type FixedExpenseAmountChange = {
  id: string
  effectivePeriod: string
  amount: number
  createdAt: string
}

export type FixedExpenseHistory = {
  expense: FixedExpense
  amountChanges: FixedExpenseAmountChange[]
  periods: FixedExpensePeriod[]
}

export type FixedExpensePeriodStatus =
  | "upcoming"
  | "pending"
  | "partial"
  | "paid"
  | "overdue"

export type FixedExpensePeriod = {
  id: string
  fixedExpenseId: string
  householdId: string
  period: string
  name: string
  categoryId: string
  expectedAmount: number
  totalPaid: number
  remaining: number
  chargeDate: string
  dueDate: string
  status: FixedExpensePeriodStatus
  category: FixedExpenseCategory | null
  lastPayment: {
    id: string
    amount: number
    paidAt: string
  } | null
}
