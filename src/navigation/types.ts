import type { NavigatorScreenParams } from "@react-navigation/native"

import type { BudgetSheetRequest } from "../features/budgets/types"
import type { TransactionFilters, TransactionSheetRequest } from "../features/transactions/types"

export type AuthStackParamList = {
  Auth: undefined
}

export type MainTabsParamList = {
  Home: undefined
  Transactions: { appliedFilters?: TransactionFilters } | undefined
  AiChat: undefined
  Budgets: undefined
  FixedExpenses: undefined
}

export type CategorySelection = {
  token: string
  householdId: string
  categoryId: string
  name: string
  icon: string | null
}

export type HouseholdSelection = {
  token: string
  householdIds: string[]
}

export type CreateMovementParams = {
  request?: TransactionSheetRequest
  categorySelection?: CategorySelection
  householdSelection?: HouseholdSelection
}

export type CategoryPickerParams =
  | {
      returnTo: "CreateMovement"
      householdId: string
      householdName: string
      entryType: "expense" | "income"
      selectedCategoryId: string | null
    }
  | {
      returnTo: "BudgetEditor"
      householdId: string
      householdName: string
      entryType: "expense"
      selectedCategoryId: string | null
    }
  | {
      returnTo: "PendingCharge"
      chargeId: string
      householdId: string
      householdName: string
      entryType: "expense"
      selectedCategoryId: string | null
    }

export type HouseholdPickerParams =
  | {
      returnTo: "CreateMovement"
      selectedHouseholdIds: string[]
      selectionMode: "multiple"
      title: string
    }
  | {
      returnTo: "PendingCharge"
      chargeId: string
      selectedHouseholdIds: string[]
      selectionMode: "single"
      title: string
    }

export type BudgetEditorParams = {
  request?: BudgetSheetRequest
  categorySelection?: CategorySelection
}

export type AppStackParamList = {
  Main: NavigatorScreenParams<MainTabsParamList> | undefined
  CreateHousehold: undefined
  InviteMember: undefined
  Invitations: undefined
  AiConversation: { conversationId?: string }
  FixedExpenseHistory: { fixedExpenseId: string }
  PayFixedExpensePeriod: { periodId: string }
  CorrectFixedExpensePayment: { paymentId: string }
  PendingCharges: undefined
  PendingCharge: {
    chargeId: string
    categorySelection?: CategorySelection
    householdSelection?: HouseholdSelection
  }
  CreateMovement: CreateMovementParams
  CategoryPicker: CategoryPickerParams
  HouseholdPicker: HouseholdPickerParams
  TransactionFilters: { filters: TransactionFilters }
  BudgetEditor: BudgetEditorParams
  Profile: undefined
}

export type RootParamList = AppStackParamList
