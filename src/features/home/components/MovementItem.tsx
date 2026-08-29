import { TransactionCard } from "../../transactions/components/TransactionCard"
import type { Transaction } from "../../transactions/types"

type MovementItemProps = {
  transaction: Transaction
}

export function MovementItem({ transaction }: MovementItemProps) {
  return (
    <TransactionCard
      context="home"
      householdType="personal"
      transaction={transaction}
    />
  )
}
