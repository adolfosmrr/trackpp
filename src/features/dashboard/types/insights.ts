export type FinancialInsight = {
  id: string
  type:
    | "monthly_spending"
    | "category_increase"
    | "budget_warning"
    | "positive_budget"
    | "balance"
  message: string
  priority: number
  value?: number
  percentage?: number | null
  categoryName?: string
}
