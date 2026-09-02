import { useBudgets } from "../../budgets/hooks/useBudgets"
import { useCategories } from "../../categories/hooks/useCategories"
import { useFixedExpensePeriods } from "../../fixedExpenses/hooks/useFixedExpensePeriods"
import type { FixedExpensePeriod } from "../../fixedExpenses/types"
import type { BudgetWithProgress } from "../../budgets/types"
import type { Category } from "../../categories/types"
import type { HomeAiInsight } from "../../dashboard/types/homeAiInsight"
import type { HomeAiInsightAction } from "../../dashboard/types/homeAiInsight"
import type { InsightActionDetail } from "../components/InsightActionPopover"

export type HomeInsightActionDetailsResult = {
  actionDetails: Record<string, InsightActionDetail | undefined>
  isLoading: boolean
  error?: Error
  refetch: () => Promise<unknown[]>
}

export function useHomeInsightActionDetails(
  insight?: HomeAiInsight
): HomeInsightActionDetailsResult {
  const actions = insight?.actions ?? []
  const needsFixedExpenses = actions.some(
    (action) => action.type === "fixed_expense_period"
  )
  const needsBudgets = actions.some((action) => action.type === "budget")
  const needsCategories = actions.some((action) => action.type === "category")

  const fixedPeriodsQuery = useFixedExpensePeriods(needsFixedExpenses)
  const budgetsQuery = useBudgets(needsBudgets)
  const categoriesQuery = useCategories("expense", needsCategories)

  const actionDetails = actions.reduce<Record<string, InsightActionDetail | undefined>>(
    (details, action) => {
      details[action.id] = resolveActionDetail(
        action,
        fixedPeriodsQuery.data,
        budgetsQuery.data,
        categoriesQuery.data
      )
      return details
    },
    {}
  )

  const relevantQueries = [
    needsFixedExpenses ? fixedPeriodsQuery : null,
    needsBudgets ? budgetsQuery : null,
    needsCategories ? categoriesQuery : null,
  ].filter(Boolean)

  const queryWithError = relevantQueries.find((query) => query?.error)

  return {
    actionDetails,
    isLoading: relevantQueries.some((query) => query?.isLoading),
    error: queryWithError?.error
      ? toError(queryWithError.error)
      : undefined,
    refetch: () => Promise.all(relevantQueries.map((query) => query!.refetch())),
  }
}

function resolveActionDetail(
  action: HomeAiInsightAction,
  fixedPeriods: FixedExpensePeriod[] | undefined,
  budgets: BudgetWithProgress[] | undefined,
  categories: Category[] | undefined
): InsightActionDetail | undefined {
  if (action.type === "fixed_expense_period") {
    const period = fixedPeriods?.find((item) => item.id === action.targetId)
    return period ? fixedExpenseDetail(period) : undefined
  }

  if (action.type === "budget") {
    const budget = budgets?.find((item) => item.id === action.targetId)
    return budget ? budgetDetail(budget) : undefined
  }

  const category = categories?.find((item) => item.id === action.targetId)
  return category
    ? {
        type: "category",
        categoryName: category.name,
      }
    : undefined
}

function fixedExpenseDetail(period: FixedExpensePeriod): InsightActionDetail {
  return {
    type: "fixed_expense_period",
    name: period.name,
    status: period.status,
    amount: String(period.expectedAmount),
    dueDate: period.dueDate,
  }
}

function budgetDetail(budget: BudgetWithProgress): InsightActionDetail {
  return {
    type: "budget",
    categoryName: budget.category.name,
    percentage: budget.percentage,
    budgetAmount: String(budget.amount),
    spent: String(budget.spent),
  }
}

function toError(value: unknown) {
  return value instanceof Error ? value : new Error("No se pudo resolver el detalle del insight")
}
