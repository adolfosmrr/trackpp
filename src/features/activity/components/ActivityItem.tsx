import {
  View,
  Text,
  StyleSheet,
} from "react-native"

import { formatRelativeTime } from "../../../utils/formatRelativeTime"
import { TransactionCard } from "../../transactions/components/TransactionCard"

import type { ActivityItem as ActivityItemData } from "../types"

type ActivityItemProps = {
  item: ActivityItemData
  currentUserId: string | undefined
}

export function ActivityItem({
  item,
  currentUserId,
}: ActivityItemProps) {
  if (item.type === "transaction_created" || item.type === "transaction_deleted") {
    const transaction = getActivityTransaction(item)

    if (transaction) {
      return (
        <TransactionCard
          context="home"
          householdType="couple"
          actorText={getActivityMessage(item, currentUserId)}
          transaction={transaction}
        />
      )
    }
  }

  const metadata = item.metadata

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.action}>
          {getActivityMessage(item, currentUserId)}
        </Text>

        <Text style={styles.time}>
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>

      <View style={styles.detail}>
        <Text style={styles.title}>
          {getString(metadata.categoryIcon)
            ? `${getString(metadata.categoryIcon)} `
            : ""}
          {getString(metadata.title) ??
            getString(metadata.name) ??
            getString(metadata.categoryName) ??
            "Actividad"}
        </Text>

        {getAmount(item) !== null && (
          <Text style={styles.amount}>
            {formatCurrency(getAmount(item)!)}
          </Text>
        )}
      </View>
    </View>
  )
}

function getActivityTransaction(item: ActivityItemData) {
  const amount = getAmount(item)
  const transactionType = item.metadata.transactionType

  if (amount === null || (transactionType !== "expense" && transactionType !== "income")) {
    return null
  }

  return {
    title: getString(item.metadata.title) ?? "Actividad",
    amount,
    type: transactionType as "expense" | "income",
    created_at: item.created_at,
    fixedExpensePayment: null,
    category: {
      name: getString(item.metadata.categoryName) ?? "Sin categoría",
      icon: getString(item.metadata.categoryIcon),
    },
  }
}

export function getActivityMessage(
  item: ActivityItemData,
  currentUserId: string | undefined
) {
  const isCurrentUser = item.actor?.id === currentUserId
  const actor = isCurrentUser
    ? "Tú"
    : item.actor?.name ?? "Otro miembro"

  if (item.type === "member_joined") {
    const householdName = getString(item.metadata.householdName)

    if (isCurrentUser) {
      return householdName
        ? `Te uniste a ${householdName}`
        : "Te uniste al espacio compartido"
    }

    if (!householdName) {
      return actor === "Otro miembro"
        ? "Se unió al espacio compartido"
        : `${actor} se unió al espacio compartido`
    }

    return `${actor} se unió a ${householdName}`
  }

  const action = getActivityAction(item, isCurrentUser)

  return `${actor} ${action}`
}

function getActivityAction(
  item: ActivityItemData,
  isCurrentUser: boolean
) {
  switch (item.type) {
    case "transaction_created":
      return item.metadata.transactionType === "income"
        ? isCurrentUser
          ? "agregaste un ingreso"
          : "agregó un ingreso"
        : isCurrentUser
          ? "agregaste un gasto"
          : "agregó un gasto"
    case "budget_created":
      return isCurrentUser
        ? "creaste un presupuesto"
        : "creó un presupuesto"
    case "budget_updated":
      return isCurrentUser
        ? "actualizaste un presupuesto"
        : "actualizó un presupuesto"
    case "transaction_deleted":
      return isCurrentUser
        ? `eliminaste un ${getTransactionNoun(item)}`
        : `eliminó un ${getTransactionNoun(item)}`
    case "budget_deleted":
      return isCurrentUser
        ? "eliminaste un presupuesto"
        : "eliminó un presupuesto"
    case "member_joined":
      return "se unió"
    case "fixed_expense_created":
      return isCurrentUser
        ? "agregaste el gasto fijo"
        : "agregó el gasto fijo"
    case "fixed_expense_updated":
      return isCurrentUser
        ? "actualizaste el gasto fijo"
        : "actualizó el gasto fijo"
    case "fixed_expense_deleted":
      return isCurrentUser
        ? "eliminaste el gasto fijo"
        : "eliminó el gasto fijo"
    case "fixed_expense_payment_created":
      return isCurrentUser
        ? "pagaste"
        : "pagó"
    case "fixed_expense_payment_updated": {
      const name = getString(item.metadata.name) ?? "un gasto fijo"
      const oldAmount = getNumber(item.metadata.oldAmount)
      const newAmount = getNumber(item.metadata.newAmount)

      if (oldAmount === null || newAmount === null) {
        return isCurrentUser
          ? `corregiste un pago de ${name}`
          : `corrigió un pago de ${name}`
      }

      return isCurrentUser
        ? `corregiste un pago de ${name} de ${formatCurrency(oldAmount)} a ${formatCurrency(newAmount)}`
        : `corrigió un pago de ${name} de ${formatCurrency(oldAmount)} a ${formatCurrency(newAmount)}`
    }
  }
}

function getTransactionNoun(item: ActivityItemData) {
  return item.metadata.transactionType === "income"
    ? "ingreso"
    : "gasto"
}

function getString(value: unknown) {
  return typeof value === "string" && value.length
    ? value
    : null
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function getAmount(item: ActivityItemData) {
  const value = item.type === "budget_updated"
    ? item.metadata.newAmount
    : item.metadata.amount

  return typeof value === "number" ? value : null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(amount)
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    gap: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  action: {
    flex: 1,
    fontWeight: "600",
  },

  time: {
    color: "#777",
    fontSize: 12,
  },

  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  title: {
    flex: 1,
    color: "#555",
  },

  amount: {
    fontWeight: "700",
  },
})
