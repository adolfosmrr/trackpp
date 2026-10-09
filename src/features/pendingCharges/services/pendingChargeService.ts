import { supabase } from "../../../services/supabase"

import type {
  BankChargeSource,
  PendingBankCharge,
  PendingChargeStatus,
} from "../types"

const PENDING_CHARGE_COLUMNS =
  "id, source, amount, currency, merchant, card_last4, charged_at, status, created_at"

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
  }
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
