import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { TransactionCard } from "./TransactionCard"
import type { Transaction } from "../types"

type TransactionsMovementsSectionProps = {
  transactions: Transaction[]
  householdType: "personal" | "couple"
  userId?: string
  deletingId: string | null
  onDelete: (transaction: Transaction) => void
}

export function TransactionsMovementsSection({
  transactions,
  householdType,
  userId,
  deletingId,
  onDelete,
}: TransactionsMovementsSectionProps) {
  const insets = useSafeAreaInsets()
  const bottomPadding = Math.max(insets.bottom, 0) + 66
  const transactionsByDate = groupTransactionsByDate(transactions)

  return (
    <View style={[styles.section, { paddingBottom: bottomPadding }]}> 
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Todos los{"\n"}Movimientos</Text>

        <View style={styles.transactionGroups}>
          {transactionsByDate.length ? (
            transactionsByDate.map((group, index) => (
              <View
                key={group.date}
                style={index < transactionsByDate.length - 1 ? styles.transactionGroupSpacing : null}
              >
                <Text style={styles.transactionDate}>
                  {formatTransactionDate(group.date)}
                </Text>
                <View style={styles.transactions}>
                  {group.transactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      context="transactions"
                      householdType={householdType}
                      actorText={householdType === "couple"
                        ? `Por ${transaction.created_by === userId ? "ti" : transaction.creator?.name ?? "otro miembro"}`
                        : undefined}
                      deleting={deletingId === transaction.id}
                      onDelete={() => onDelete(transaction)}
                      transaction={transaction}
                    />
                  ))}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Todavía no hay movimientos.</Text>
          )}
        </View>
      </View>
    </View>
  )
}

function groupTransactionsByDate(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    const date = transaction.transaction_date.slice(0, 10)
    const group = groups.get(date)

    if (group) {
      group.push(transaction)
    } else {
      groups.set(date, [transaction])
    }
  }

  return [...groups.entries()]
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, groupedTransactions]) => ({
      date,
      transactions: groupedTransactions,
    }))
}

function formatTransactionDate(date: string) {
  const dateValue = date.length === 10
    ? `${date}T00:00:00`
    : date

  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
  })
    .format(new Date(dateValue))
    .replace(/[.,]/g, "")
    .slice(0, 3)

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(dateValue))

  return `${weekday} • ${formattedDate}`
    .replace(/[.,]/g, "")
    .toUpperCase()
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#E6E6E6",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    marginHorizontal: -20,
    paddingTop: 50,
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 40,
    lineHeight: 40,
  },
  transactionGroups: {
    marginTop: 40,
  },
  transactionGroupSpacing: {
    marginBottom: 40,
  },
  transactions: {
    gap: 12,
  },
  transactionDate: {
    color: "#1C1C1C",
    fontFamily: "Satoshi-Bold",
    fontSize: 16,
    lineHeight: 16,
    marginBottom: 20,
    opacity: 0.5,
  },
  empty: {
    color: "#777",
    marginTop: 40,
    textAlign: "center",
  },
})
