import { Pressable, StyleSheet, Text, View } from "react-native"
import type { Transaction } from "../../transactions/types"
import { EmptyState } from "../../../components/feedback/EmptyState"
import { colors, fonts, radii } from "../../../theme"
import { MovementItem } from "./MovementItem"

type MovementsSectionProps = {
  transactions: Transaction[]
  onViewAll: () => void
  onCreate: () => void
}

export function MovementsSection({ transactions, onViewAll, onCreate }: MovementsSectionProps) {
  const transactionsByDate = groupTransactionsByDate(transactions)

  return (
    <View style={styles.section}>
      <View style={styles.content}>
        <View>
          <Text style={styles.sectionTitle}>Movimientos{"\n"}Recientes</Text>
          <Pressable accessibilityRole="button" style={styles.viewAllButton} onPress={onViewAll}>
            <Text style={styles.viewAllText}>Ver todos</Text>
          </Pressable>
        </View>

        <View style={styles.transactionGroups}>
          {transactionsByDate.length ? (
            transactionsByDate.map((group, index) => (
              <View
                key={group.date}
                style={[
                  index < transactionsByDate.length - 1
                    ? styles.transactionGroupSpacing
                    : null,
                ]}
              >
                <Text style={styles.transactionDate}>
                  {formatTransactionDate(group.date)}
                </Text>
                <View style={styles.transactions}>
                  {group.transactions.map((transaction) => (
                    <MovementItem key={transaction.id} transaction={transaction} />
                  ))}
                </View>
              </View>
            ))
          ) : (
            <EmptyState
              title="Todavía no cargaste movimientos"
              body="Anotá un gasto o un ingreso con el botón + Movimiento."
              actionLabel="Agregar movimiento"
              onAction={onCreate}
            />
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
    position: "relative",
    marginTop: 4,
    paddingTop: 8,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  content: {},
  sectionTitle: {
    marginBottom: 12,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
    fontFamily: fonts.sansSemibold,
    color: colors.foreground,
  },
  viewAllButton: {
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  viewAllText: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 14,
  },
  transactions: {
    gap: 12,
  },
  transactionGroups: {
    marginTop: 40,
  },
  transactionGroupSpacing: {
    marginBottom: 40,
  },
  transactionDate: {
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: fonts.monoMedium,
    color: colors.mutedForeground,
  },
  empty: {
    color: colors.mutedForeground,
    textAlign: "center",
    paddingVertical: 24,
  },
})
