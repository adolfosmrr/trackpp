import type {
  Transaction,
  TransactionCategory,
  TransactionCreator,
  TransactionDateFilter,
  TransactionFilters,
} from "../types"

export function filterAndSortTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  return transactions
    .filter((transaction) => matchesFilters(transaction, filters))
    .slice()
    .sort((transactionA, transactionB) => compareTransactions(transactionA, transactionB, filters.order))
}

export function groupTransactionsByDate(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    const date = transaction.transaction_date.slice(0, 10)
    const group = groups.get(date)

    if (group) {
      group.push(transaction)
    } else {
      groups.set(date, [transaction])
    }
  }

  return [...groups.entries()].map(([date, groupedTransactions]) => ({
    date,
    transactions: groupedTransactions,
  }))
}

export function formatTransactionDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number)
  const dateValue = new Date(year, month - 1, day)

  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
  })
    .format(dateValue)
    .replace(/[.,]/g, "")
    .slice(0, 3)

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(dateValue)

  return `${weekday} • ${formattedDate}`
    .replace(/[.,]/g, "")
    .toUpperCase()
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getTransactionCategories(transactions: Transaction[]): TransactionCategory[] {
  const categories = new Map<string, TransactionCategory>()

  for (const transaction of transactions) {
    if (transaction.category) {
      categories.set(transaction.category.id, transaction.category)
    }
  }

  return [...categories.values()].sort((categoryA, categoryB) =>
    categoryA.name.localeCompare(categoryB.name)
  )
}

export function getTransactionCreators(transactions: Transaction[]): TransactionCreator[] {
  const creators = new Map<string, TransactionCreator>()

  for (const transaction of transactions) {
    if (transaction.creator) {
      creators.set(transaction.creator.id, transaction.creator)
    }
  }

  return [...creators.values()].sort((creatorA, creatorB) =>
    (creatorA.name ?? "").localeCompare(creatorB.name ?? "")
  )
}

function matchesFilters(transaction: Transaction, filters: TransactionFilters) {
  const isFixed = transaction.fixedExpensePayment !== null

  if (filters.type === "income" && transaction.type !== "income") return false
  if (filters.type === "expense" && (transaction.type !== "expense" || isFixed)) return false
  if (filters.type === "fixed" && !isFixed) return false

  if (filters.categoryId !== null && transaction.category_id !== filters.categoryId) {
    return false
  }

  if (filters.creatorId !== null && transaction.creator?.id !== filters.creatorId) {
    return false
  }

  return matchesDateFilter(transaction.transaction_date.slice(0, 10), filters.date)
}

function matchesDateFilter(date: string, filter: TransactionDateFilter) {
  if (filter.type === "any") return true

  const today = getLocalDateString()
  if (filter.type === "today") return date === today
  if (filter.type === "this-month") return date.slice(0, 7) === today.slice(0, 7)

  if (filter.type === "previous-month") {
    const previousMonth = new Date()
    previousMonth.setDate(1)
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    return date.slice(0, 7) === getLocalDateString(previousMonth).slice(0, 7)
  }

  if (filter.type === "specific") return date === filter.date
  return date >= filter.from && date <= filter.to
}

function compareTransactions(
  transactionA: Transaction,
  transactionB: Transaction,
  order: TransactionFilters["order"],
) {
  if (order === "amount-desc" || order === "amount-asc") {
    const amountDifference = Math.abs(transactionB.amount) - Math.abs(transactionA.amount)
    if (amountDifference !== 0) {
      return order === "amount-desc" ? amountDifference : -amountDifference
    }
  }

  const dateDifference = transactionA.transaction_date.localeCompare(transactionB.transaction_date)
  const createdDifference = transactionA.created_at.localeCompare(transactionB.created_at)
  const newestFirst = order !== "oldest"

  if (dateDifference !== 0) return newestFirst ? -dateDifference : dateDifference
  return newestFirst ? -createdDifference : createdDifference
}
