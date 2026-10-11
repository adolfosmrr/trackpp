export type AuthStackParamList = {
  Auth: undefined
}

export type MainTabsParamList = {
  Home: undefined
  Transactions: undefined
  AiChat: undefined
  Budgets: undefined
}

export type AppStackParamList = {
  Main: undefined
  CreateHousehold: undefined
  InviteMember: undefined
  Invitations: undefined
  AiConversation: { conversationId?: string }
  FixedExpenses: undefined
  PayFixedExpensePeriod: { periodId: string }
  CorrectFixedExpensePayment: { paymentId: string }
  PendingCharges: undefined
  PendingCharge: { chargeId: string }
}
