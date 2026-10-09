export type BankChargeSource = "naranja" | "naranjax" | "galicia" | "other"

export type PendingChargeStatus = "pending" | "assigned" | "dismissed"

export type PendingBankCharge = {
  id: string
  source: BankChargeSource
  amount: number
  currency: string
  merchant: string | null
  card_last4: string | null
  charged_at: string | null
  status: PendingChargeStatus
  created_at: string
}
