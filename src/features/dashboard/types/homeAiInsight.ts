export type HomeAiInsightAction = {
  id: string
  type: "fixed_expense_period" | "budget" | "category"
  text: string
  label: string
  targetId: string
}

export type HomeAiInsight = {
  intro: string
  groups: HomeAiInsightGroup[]
  message: string
  actions: HomeAiInsightAction[]
}
export type HomeAiInsightGroup = {
  id: string
  text: string
  actionIds: string[]
}
