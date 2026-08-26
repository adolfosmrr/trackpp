export type HouseholdActivityType =
  | "transaction_created"
  | "budget_created"
  | "budget_updated"
  | "transaction_deleted"
  | "budget_deleted"
  | "member_joined"
  | "fixed_expense_created"
  | "fixed_expense_updated"
  | "fixed_expense_deleted"
  | "fixed_expense_payment_created"
  | "fixed_expense_payment_updated"

export type ActivityActor = {
  id: string
  name: string | null
  avatar_url: string | null
}

export type HouseholdActivity = {
  id: string
  household_id: string
  actor_id: string | null
  type: HouseholdActivityType
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor: ActivityActor | null
}

export type ActivityItem = HouseholdActivity
