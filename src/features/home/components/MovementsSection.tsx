import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg"
import type { Transaction } from "../../transactions/types"
import { MovementItem } from "./MovementItem"

type MovementsSectionProps = {
  transactions: Transaction[]
  onViewAll: () => void
}

export function MovementsSection({ transactions, onViewAll }: MovementsSectionProps) {
  const insets = useSafeAreaInsets()
  const bottomPadding = Math.max(insets.bottom, 0) + 66
  const transactionsByDate = groupTransactionsByDate(transactions)

  return (
    <View style={[styles.section, { paddingBottom: bottomPadding }]}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient
              id="movements-section-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0" stopColor="#BFFFC7" />
              <Stop offset="1" stopColor="#18A5A7" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#movements-section-gradient)" />
        </Svg>
      </View>

      <View style={styles.content}>
        <View>
          <Text style={styles.sectionTitle}>Movimientos{"\n"}Recientes</Text>
          <Pressable style={styles.viewAllButton} onPress={onViewAll}>
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
                    <MovementItem
                      key={transaction.id}
                      title={transaction.title}
                      categoryIcon={transaction.category?.icon}
                      categoryName={transaction.category?.name}
                      amount={Number(transaction.amount)}
                      type={transaction.type}
                    />
                  ))}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No hay movimientos recientes.</Text>
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

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(dateValue))
    .replace(/Sept/g, "Sep")
    .replace(/,/g, "")
}

const styles = StyleSheet.create({
  section: {
    position: "relative",
    marginTop: 10,
    marginHorizontal: -20,
    paddingTop: 50,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFill,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 20,
    fontSize: 40,
    lineHeight: 40,
    fontFamily: "FamiljenGrotesk-Bold",
    color: "#1C1C1C",
  },
  viewAllButton: {
    height: 28,
    paddingHorizontal: 20,
    backgroundColor: "#000000",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  viewAllText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 12,
    lineHeight: 12,
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
    fontFamily: "Satoshi-Regular",
    color: "#1C1C1C",
    opacity: 0.5,
  },
  empty: {
    color: "#777",
    textAlign: "center",
    paddingVertical: 24,
  },
})
