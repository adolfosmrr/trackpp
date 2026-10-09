import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fonts, radii } from "../../../theme"
import { useMemo } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { EmptyState } from "../../../components/feedback/EmptyState"
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
  onDelete: (transaction: Transaction) => void
  onCreate: () => void
  onClearFilters: () => void
  filters: TransactionFilters
  activeFilterCount: number
  onOpenFilters: () => void
}

export function TransactionsMovementsSection({
  transactions,
  householdType,
  userId,
  onDelete,
  onCreate,
  onClearFilters,
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
          <Pressable accessibilityRole="button" style={styles.filterButton} onPress={onOpenFilters}>
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
                      onDelete={() => onDelete(transaction)}
                      transaction={transaction}
                    />
                  ))}
                </View>
              </View>
            ))
          ) : transactions.length && !hasFilteredResults ? (
            <EmptyState
              title="Nada coincide con estos filtros"
              body="Probá con otro período o limpiá los filtros para ver todos los movimientos."
              actionLabel="Limpiar filtros"
              onAction={onClearFilters}
            />
          ) : (
            <EmptyState
              title="Todavía no cargaste movimientos"
              body="Anotá un gasto, un ingreso o un gasto fijo desde el botón + Movimiento."
              actionLabel="Agregar movimiento"
              onAction={onCreate}
            />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.transparent,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginHorizontal: 0,
    paddingTop: 16,
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  filterButtonText: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
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
    color: colors.mutedForeground,
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  empty: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    marginTop: 40,
    textAlign: "center",
  },
})
