import { supabase } from "../../../services/supabase"

import type {
  BankChargeSource,
  PendingBankCharge,
  PendingChargeFixedExpenseSuggestion,
  PendingChargeStatus,
} from "../types"

const PENDING_CHARGE_COLUMNS =
  "id, source, amount, currency, merchant, card_last4, charged_at, status, created_at, suggested_period_id"

export async function listPendingCharges(userId: string): Promise<PendingBankCharge[]> {
  const { data, error } = await supabase
    .from("pending_bank_charges")
    .select(PENDING_CHARGE_COLUMNS)
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapCharge)
}

export async function getPendingCharge(chargeId: string): Promise<PendingBankCharge | null> {
  const { data, error } = await supabase
    .from("pending_bank_charges")
    .select(PENDING_CHARGE_COLUMNS)
    .eq("id", chargeId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapCharge(data) : null
}

export async function assignPendingCharge(input: {
  chargeId: string
  householdId: string
  categoryId: string
}) {
  const { data, error } = await supabase.rpc("assign_pending_charge", {
    p_charge_id: input.chargeId,
    p_household_id: input.householdId,
    p_category_id: input.categoryId,
  })

  if (error) {
    throw new Error(error.message || "No se pudo cargar el gasto.")
  }

  if (!isRecord(data) || typeof data.id !== "string") {
    throw new Error("No se pudo crear el movimiento.")
  }

  return { transactionId: data.id }
}

export async function getPendingChargeSuggestion(
  chargeId: string,
): Promise<PendingChargeFixedExpenseSuggestion | null> {
  const { data, error } = await supabase.rpc("get_pending_charge_suggestion", {
    p_charge_id: chargeId,
  })

  if (error) {
    throw new Error(error.message || "No se pudo revisar el débito automático.")
  }

  if (data == null) return null
  return parseSuggestion(data)
}

export async function linkPendingChargeToFixedExpense(input: {
  chargeId: string
  periodId: string
}) {
  const { data, error } = await supabase.rpc("link_pending_charge_to_period", {
    p_charge_id: input.chargeId,
    p_period_id: input.periodId,
  })

  if (error) {
    throw new Error(error.message || "No se pudo vincular el débito.")
  }

  if (!isRecord(data) || typeof data.transactionId !== "string" || typeof data.householdId !== "string") {
    throw new Error("No se pudo registrar el pago del gasto fijo.")
  }

  return {
    transactionId: data.transactionId,
    householdId: data.householdId,
  }
}

export async function dismissPendingCharge(chargeId: string) {
  const { error } = await supabase.rpc("dismiss_pending_charge", {
    p_charge_id: chargeId,
  })

  if (error) {
    throw new Error(error.message || "No se pudo descartar el gasto.")
  }
}

function mapCharge(row: {
  id: string
  source: string
  amount: number | string
  currency: string
  merchant: string | null
  card_last4: string | null
  charged_at: string | null
  status: string
  created_at: string
  suggested_period_id: string | null
}): PendingBankCharge {
  if (!isSource(row.source) || !isStatus(row.status)) {
    throw new Error("El gasto pendiente tiene un formato inválido.")
  }

  const amount = typeof row.amount === "number" ? row.amount : Number(row.amount)
  if (!Number.isFinite(amount)) {
    throw new Error("El gasto pendiente tiene un monto inválido.")
  }

  return {
    id: row.id,
    source: row.source,
    amount,
    currency: row.currency,
    merchant: row.merchant,
    card_last4: row.card_last4,
    charged_at: row.charged_at,
    status: row.status,
    created_at: row.created_at,
    suggestedPeriodId: typeof row.suggested_period_id === "string"
      ? row.suggested_period_id
      : null,
  }
}

function parseSuggestion(value: unknown): PendingChargeFixedExpenseSuggestion {
  if (!isRecord(value)) {
    throw new Error("La sugerencia del débito automático es inválida.")
  }

  const expectedAmount = finiteNumber(value.expectedAmount)
  const remaining = finiteNumber(value.remaining)
  const suggestion = {
    periodId: typeof value.periodId === "string" ? value.periodId : "",
    fixedExpenseId: typeof value.fixedExpenseId === "string" ? value.fixedExpenseId : "",
    householdId: typeof value.householdId === "string" ? value.householdId : "",
    name: typeof value.name === "string" ? value.name : "",
    period: typeof value.period === "string" ? value.period : "",
    expectedAmount,
    remaining,
  }

  if (
    !suggestion.periodId
    || !suggestion.fixedExpenseId
    || !suggestion.householdId
    || !suggestion.name
    || !suggestion.period
    || suggestion.expectedAmount === null
    || suggestion.remaining === null
  ) {
    throw new Error("La sugerencia del débito automático está incompleta.")
  }

  return {
    ...suggestion,
    expectedAmount: suggestion.expectedAmount,
    remaining: suggestion.remaining,
  }
}

function finiteNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

function isSource(value: string): value is BankChargeSource {
  return value === "naranja" || value === "naranjax" || value === "galicia" || value === "other"
}

function isStatus(value: string): value is PendingChargeStatus {
  return value === "pending" || value === "assigned" || value === "dismissed"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
