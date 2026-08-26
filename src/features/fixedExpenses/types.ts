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
  isActive?: boolean
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
