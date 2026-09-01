export type BudgetCategory = {
  id: string
  name: string
  icon: string | null
}

export type BudgetConfig = {
  id: string
  household_id: string
  category_id: string
  amount: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type Budget = {
  id: string
  household_id: string
  category_id: string
  created_by: string
  amount: number
  month: string
  created_at: string
  updated_at: string
  category: BudgetCategory
}

export type BudgetWithProgress = Budget & {
  spent: number
  remaining: number
  percentage: number
  progressPercentage: number
}

export type BudgetSheetRequest =
  | { kind: "create" }
  | { kind: "edit"; budget: Budget }

export type CreateBudgetInput = {
  householdId: string
  categoryId: string
  userId: string
  amount: number
  month: string
}
