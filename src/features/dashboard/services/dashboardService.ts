import { supabase } from "../../../services/supabase"

import type {
  Transaction,
} from "../../transactions/types"

import type {
  DashboardData,
} from "../types"

export async function getDashboard(
  householdId: string
): Promise<DashboardData> {
  const now = new Date()

  const year = now.getFullYear()
  const month = now.getMonth()

  const firstDay = new Date(
    year,
    month,
    1
  )

  const firstDayNextMonth = new Date(
    year,
    month + 1,
    1
  )

  const startDate = formatDate(firstDay)
  const endDate = formatDate(firstDayNextMonth)

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
       category:categories (
         id,
         name,
         icon
       ),
       creator:profiles!transactions_created_by_fkey(
        id,
        name,
        avatar_url
      )
    `)
    .eq("household_id", householdId)
    .gte("transaction_date", startDate)
    .lt("transaction_date", endDate)
    .order("transaction_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    throw error
  }

  const transactions =
    data as Transaction[]

  const income = transactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    )

  const expenses = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    )

  const balance = income - expenses

  const recentTransactions =
    transactions.slice(0, 5)

  return {
    balance,
    income,
    expenses,
    recentTransactions,
  }
}

function formatDate(date: Date) {
  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0")

  const day = String(
    date.getDate()
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}
