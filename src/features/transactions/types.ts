export type TransactionType = "expense" | "income"

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

export type Transaction = {
  id: string
  household_id: string
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
