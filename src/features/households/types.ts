export type {
    Category,
    CategoryType,
} from "../categories/types"

export type {
    CreateTransactionInput,
    Transaction,
    TransactionCategory,
    TransactionType,
} from "../transactions/types"

export type HouseholdMembership = {
    id: string
    household_id: string
    user_id: string
    role: string
    joined_at: string
    household: {
        id: string
        name: string
        type: string
        currency: string
        created_by: string
        created_at: string
  }
}
