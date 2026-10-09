import { Pressable, StyleSheet, Text, View } from "react-native"

import { colors, fonts, radii } from "../../../theme"
import type { Transaction, TransactionCategory } from "../types"

export type TransactionCardContext = "home" | "transactions"
export type TransactionCardHouseholdType = "personal" | "couple"

type TransactionCardTransaction = Pick<
  Transaction,
  "title" | "amount" | "type" | "created_at" | "fixedExpensePayment"
> & {
  category?: Pick<TransactionCategory, "name" | "icon"> | null
}

type TransactionCardProps = {
  transaction: TransactionCardTransaction
  context: TransactionCardContext
  householdType: TransactionCardHouseholdType
  actorText?: string
  onDelete?: () => void
  deleting?: boolean
}

export function TransactionCard({
  transaction,
  context,
  householdType,
  actorText,
  onDelete,
  deleting = false,
}: TransactionCardProps) {
  const fixedExpense = transaction.fixedExpensePayment != null
  const typeLabel = getTypeLabel(transaction, fixedExpense)
  const time = formatTransactionTime(transaction.created_at)
  const showActor = householdType === "couple" && Boolean(actorText)
  const canDelete = context === "transactions" && !fixedExpense && Boolean(onDelete)

  return (
    <View style={styles.card}>
      {showActor ? (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.actor}>{actorText}</Text>
            {context === "transactions" ? (
              <TransactionAction
                canDelete={canDelete}
                deleting={deleting}
                fixedExpense={fixedExpense}
                onDelete={onDelete}
              />
            ) : null}
          </View>
          <Divider />
        </>
      ) : null}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {transaction.title}
          </Text>
          <Text
            style={[
              styles.amount,
              transaction.type === "expense" ? styles.expenseAmount : styles.incomeAmount,
            ]}
          >
            {transaction.type === "expense" ? "-" : "+"}
            {formatCurrency(Math.abs(transaction.amount))}
          </Text>
        </View>

        <View style={styles.categoryRow}>
          {transaction.category?.icon ? (
            <Text style={styles.categoryIcon}>{transaction.category.icon}</Text>
          ) : null}
          <Text style={styles.categoryName}>
            {transaction.category?.name ?? "Sin categoría"}
          </Text>
        </View>
      </View>

      <Divider />

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          {context === "transactions" && householdType === "personal"
            ? `${typeLabel} • ${time}`
            : typeLabel}
        </Text>

        {context === "transactions" && householdType === "personal" ? (
          <TransactionAction
            canDelete={canDelete}
            deleting={deleting}
            fixedExpense={fixedExpense}
            onDelete={onDelete}
          />
        ) : (
          <Text style={styles.footerText}>{time}</Text>
        )}
      </View>
    </View>
  )
}

function TransactionAction({
  canDelete,
  deleting,
  fixedExpense,
  onDelete,
}: {
  canDelete: boolean
  deleting: boolean
  fixedExpense: boolean
  onDelete?: () => void
}) {
  if (fixedExpense) {
    return <Text style={styles.cannotDelete}>No se puede eliminar</Text>
  }

  if (!canDelete || !onDelete) return null

  return (
    <Pressable
      accessibilityLabel="Eliminar movimiento"
      disabled={deleting}
      onPress={onDelete}
    >
      <Text style={styles.delete}>{deleting ? "Eliminando..." : "Eliminar"}</Text>
    </Pressable>
  )
}

function Divider() {
  return <View style={styles.divider} />
}

function getTypeLabel(
  transaction: TransactionCardTransaction,
  fixedExpense: boolean,
) {
  if (fixedExpense) return "GASTO FIJO"
  return transaction.type === "expense" ? "GASTO" : "INGRESO"
}

function formatTransactionTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--:--"

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(amount)
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actor: {
    flex: 1,
    color: colors.brand,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  content: {
    gap: 10,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
  },
  categoryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
    lineHeight: 16,
  },
  categoryName: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 16,
  },
  amount: {
    flexShrink: 0,
    fontFamily: fonts.monoSemibold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "right",
  },
  incomeAmount: {
    color: colors.brand,
  },
  expenseAmount: {
    color: colors.destructive,
  },
  divider: {
    width: "100%",
    height: 1,
    marginVertical: 10,
    backgroundColor: colors.border,
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  footerText: {
    color: colors.mutedForeground,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 16,
  },
  delete: {
    color: colors.destructive,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 12,
  },
  cannotDelete: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
})
