import type { NavigatorScreenParams } from "@react-navigation/native"

export type AuthStackParamList = {
  Auth: undefined
}

export type MainTabsParamList = {
  Home: undefined
  Transactions: undefined
  AiChat: undefined
  Budgets: undefined
  FixedExpenses: undefined
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
  PendingCharge: { chargeId: string }
}

export type RootParamList = AppStackParamList
