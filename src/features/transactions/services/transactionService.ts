import { supabase } from "../../../services/supabase"

import type {
  CreateTransactionInput,
  Transaction,
} from "../types"

export async function getTransactions(
  householdId: string
): Promise<Transaction[]> {
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
    .order("transaction_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data as Transaction[]
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  const { data, error } = await supabase.rpc(
    "create_transaction_with_activity",
    {
      p_household_id: input.householdId,
      p_type: input.type,
      p_title: input.title,
      p_amount: input.amount,
      p_description: input.description ?? null,
      p_category_id: input.categoryId ?? null,
      p_transaction_date:
        input.transactionDate ??
        new Date().toISOString().slice(0, 10),
    }
  )

  if (error) {
    throw error
  }

  return parseTransactionRpcResult(data)
}

export async function deleteTransaction(
  transactionId: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "delete_transaction_with_activity",
    {
      p_transaction_id: transactionId,
    }
  )

  if (error) {
    throw error
  }
}

function parseTransactionRpcResult(
  value: unknown
): Transaction {
  if (!isRecord(value)) {
    throw new Error("La RPC devolvió una transaction inválida.")
  }

  const type = value.type
  if (type !== "expense" && type !== "income") {
    throw new Error("La RPC devolvió un tipo de transaction inválido.")
  }

  const id = getString(value.id)
  const householdId = getString(value.household_id)
  const createdBy = getString(value.created_by)
  const title = getString(value.title)
  const transactionDate = getString(value.transaction_date)
  const createdAt = getString(value.created_at)
  const updatedAt = getString(value.updated_at)
  const amount = getNumber(value.amount)

  if (
    !id ||
    !householdId ||
    !createdBy ||
    !title ||
    !transactionDate ||
    !createdAt ||
    !updatedAt ||
    amount === null
  ) {
    throw new Error("La RPC devolvió una transaction incompleta.")
  }

  return {
    id,
    household_id: householdId,
    created_by: createdBy,
    type,
    title,
    description: getNullableString(value.description),
    amount,
    category_id: getNullableString(value.category_id),
    category: parseCategory(value.category),
    creator: parseCreator(value.creator),
    transaction_date: transactionDate,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

function parseCategory(value: unknown): Transaction["category"] {
  if (value === null || value === undefined) {
    return null
  }

  if (!isRecord(value)) {
    throw new Error("La RPC devolvió una categoría inválida.")
  }

  const id = getString(value.id)
  const name = getString(value.name)
  if (!id || !name) {
    throw new Error("La RPC devolvió una categoría incompleta.")
  }

  return {
    id,
    name,
    icon: getNullableString(value.icon),
  }
}

function parseCreator(value: unknown): Transaction["creator"] {
  if (value === null || value === undefined) {
    return null
  }

  if (!isRecord(value)) {
    throw new Error("La RPC devolvió un creator inválido.")
  }

  const id = getString(value.id)
  if (!id) {
    throw new Error("La RPC devolvió un creator incompleto.")
  }

  return {
    id,
    name: getNullableString(value.name),
    avatar_url: getNullableString(value.avatar_url),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null
}

function getNullableString(value: unknown) {
  return value === null || value === undefined
    ? null
    : getString(value)
}

function getNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}
