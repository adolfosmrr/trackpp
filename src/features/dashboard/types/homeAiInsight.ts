export type HomeAiInsightAction = {
  id: string
  type: "fixed_expense_period" | "budget" | "category"
  text: string
  label: string
  targetId: string
}

export type HomeAiInsight = {
  message: string
  actions: HomeAiInsightAction[]
}
