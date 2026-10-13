import type { FixedExpensePeriodStatus } from "../types"

export function fixedExpenseStatusLabel(status: FixedExpensePeriodStatus) {
  switch (status) {
    case "upcoming":
      return "Próximo"
    case "pending":
      return "Pendiente"
    case "partial":
      return "Parcial"
    case "paid":
      return "Pagado"
    case "overdue":
      return "Vencido"
  }
}
