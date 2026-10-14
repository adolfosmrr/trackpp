import { StyleSheet, Text, View } from "react-native"
import type { Transaction } from "../../transactions/types"
import { EmptyState } from "../../../components/feedback/EmptyState"
import { ListSection } from "../../../components/layout/ListSection"
import { SectionHeader } from "../../../components/layout/SectionHeader"
import { colors, fonts, layout } from "../../../theme"
import { formatTransactionDate, groupTransactionsByDate } from "../../transactions/utils/transactionFilters"
import { MovementItem } from "./MovementItem"

type MovementsSectionProps = {
  transactions: Transaction[]
  onViewAll: () => void
  onCreate: () => void
}

export function MovementsSection({ transactions, onViewAll, onCreate }: MovementsSectionProps) {
  const transactionsByDate = groupTransactionsByDate(transactions)
    .slice()
    .sort((groupA, groupB) => groupB.date.localeCompare(groupA.date))

  return (
    <ListSection>
      <View>
        <SectionHeader actionLabel="Ver todos" onAction={onViewAll} title={"Movimientos\nRecientes"} />

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
              body="Anota un gasto o un ingreso con el botón + Movimiento."
              actionLabel="Agregar movimiento"
              onAction={onCreate}
            />
          )}
        </View>
      </View>
    </ListSection>
  )
}

const styles = StyleSheet.create({
  transactions: {
    gap: 12,
  },
  transactionGroups: {
    marginTop: layout.titleContentGap,
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
})
