import type { Transaction } from "../transactions/types"

export type DashboardData = {
  balance: number
  income: number
  expenses: number
  recentTransactions: Transaction[]
}
