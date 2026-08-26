export type CategoryType = "expense" | "income"

export type Category = {
  id: string
  household_id: string
  name: string
  icon: string | null
  color: string | null
  type: CategoryType
  is_default: boolean
  created_at: string
}
