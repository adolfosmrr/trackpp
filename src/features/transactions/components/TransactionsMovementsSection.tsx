import { Pressable, StyleSheet, Text, View } from "react-native"
import { useMemo } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { TransactionCard } from "./TransactionCard"
import type { Transaction, TransactionFilters } from "../types"
import {
  filterAndSortTransactions,
  formatTransactionDate,
  groupTransactionsByDate,
} from "../utils/transactionFilters"

type TransactionsMovementsSectionProps = {
  transactions: Transaction[]
  householdType: "personal" | "couple"
  userId?: string
  deletingId: string | null
  onDelete: (transaction: Transaction) => void
  filters: TransactionFilters
  activeFilterCount: number
  onOpenFilters: () => void
}

export function TransactionsMovementsSection({
  transactions,
  householdType,
  userId,
  deletingId,
  onDelete,
  filters,
  activeFilterCount,
  onOpenFilters,
}: TransactionsMovementsSectionProps) {
  const insets = useSafeAreaInsets()
  const bottomPadding = Math.max(insets.bottom, 0) + 66
  const filteredTransactions = useMemo(
    () => filterAndSortTransactions(transactions, filters),
    [transactions, filters]
  )
  const transactionsByDate = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions]
  )
  const hasFilteredResults = filteredTransactions.length > 0

  return (
    <View style={[styles.section, { paddingBottom: bottomPadding }]}> 
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Todos los{"\n"}Movimientos</Text>
          <Pressable style={styles.filterButton} onPress={onOpenFilters}>
            <Text style={styles.filterButtonText}>
              {activeFilterCount ? `Filtrar · ${activeFilterCount}` : "Filtrar"}
            </Text>
          </Pressable>
        </View>

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
            <Text style={styles.empty}>
              {transactions.length && !hasFilteredResults
                ? "No hay movimientos que coincidan con estos filtros."
                : "Todavía no hay movimientos."}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
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
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterButtonText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 12,
    lineHeight: 12,
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
