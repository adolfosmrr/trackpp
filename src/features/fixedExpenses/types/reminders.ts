export type FixedExpenseReminderType =
  | "charge_in_5_days"
  | "charge_tomorrow"
  | "charge_today"
  | "due_soon"
  | "due_tomorrow"
  | "due_today"
  | "overdue"

export type FixedExpenseReminder = {
  id: string
  fixedExpensePeriodId: string
  fixedExpenseId: string
  type: FixedExpenseReminderType
  name: string
  expectedAmount: number
  totalPaid: number
  remaining: number
  chargeDate: string
  dueDate: string
  daysUntilCharge: number
  daysUntilDue: number
  message: string
  priority: number
}
