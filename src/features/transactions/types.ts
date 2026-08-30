export type TransactionType = "expense" | "income"

export type TransactionTypeFilter = "all" | "income" | "expense" | "fixed"

export type TransactionOrder =
  | "newest"
  | "oldest"
  | "amount-desc"
  | "amount-asc"

export type TransactionDateFilter =
  | { type: "any" }
  | { type: "today" }
  | { type: "this-month" }
  | { type: "previous-month" }
  | { type: "specific"; date: string }
  | { type: "range"; from: string; to: string }

export type TransactionFilters = {
  type: TransactionTypeFilter
  order: TransactionOrder
  date: TransactionDateFilter
  categoryId: string | null
  creatorId: string | null
}

export const defaultTransactionFilters: TransactionFilters = {
  type: "all",
  order: "newest",
  date: { type: "any" },
  categoryId: null,
  creatorId: null,
}

export type TransactionCategory = {
  id: string
  name: string
  icon: string | null
}

export type TransactionCreator = {
  id: string
  name: string | null
  avatar_url: string | null
}

export type FixedExpensePaymentReference = {
  id: string
  fixed_expense_period_id: string
  fixed_expense_period: {
    id: string
    fixed_expense_id: string
    name: string
  } | null
}

export type Transaction = {
  id: string
  household_id: string
  linked_group_id: string | null
  created_by: string
  type: TransactionType
  title: string
  description: string | null
  amount: number
  category_id: string | null
  category: TransactionCategory | null
  creator: TransactionCreator | null
  transaction_date: string
  created_at: string
  updated_at: string
  fixedExpensePayment: FixedExpensePaymentReference | null
}

export type CreateTransactionInput = {
  householdId: string
  userId: string
  type: TransactionType
  title: string
  description?: string
  amount: number
  categoryId?: string
  transactionDate?: string
}

export type LinkedTransactionTarget = {
  householdId: string
  categoryId: string | null
}

export type CreateLinkedTransactionsInput = {
  type: TransactionType
  title: string
  description?: string
  amount: number
  transactionDate?: string
  targets: LinkedTransactionTarget[]
}
