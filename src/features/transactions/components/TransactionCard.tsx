import { Pressable, StyleSheet, Text, View } from "react-native"

import { AppText } from "../../../components/text/AppText"
import { useFormatMoney } from "../../households/hooks/useFormatMoney"
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
  const format = useFormatMoney()
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
            <AppText style={styles.actor} tone="brand" variant="caption">{actorText}</AppText>
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
          <AppText numberOfLines={2} style={styles.title} variant="subtitle">
            {transaction.title}
          </AppText>
          <Text
            style={[
              styles.amount,
              transaction.type === "expense" ? styles.expenseAmount : styles.incomeAmount,
            ]}
          >
            {transaction.type === "expense" ? "-" : "+"}
            {format(Math.abs(transaction.amount))}
          </Text>
        </View>

        <View style={styles.categoryRow}>
          {transaction.category?.icon ? (
            <AppText variant="subtitle">{transaction.category.icon}</AppText>
          ) : null}
          <AppText tone="muted" variant="body">
            {transaction.category?.name ?? "Sin categoría"}
          </AppText>
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
    return <AppText tone="muted" variant="caption">No se puede eliminar</AppText>
  }

  if (!canDelete || !onDelete) return null

  return (
    <Pressable
      accessibilityLabel="Eliminar movimiento"
      disabled={deleting}
      hitSlop={8}
      onPress={onDelete}
      style={styles.deleteHit}
    >
      <AppText tone="destructive" variant="caption">{deleting ? "Eliminando..." : "Eliminar"}</AppText>
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
  },
  categoryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
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
  deleteHit: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
})
