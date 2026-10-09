import { Pressable, StyleSheet, Text } from "react-native"

import { formatMoney } from "../../../utils/formatMoney"
import { colors, fonts, radii } from "../../../theme"
import {
  getCurrentFixedExpensePeriod,
  useFixedExpensePeriods,
} from "../../fixedExpenses/hooks/useFixedExpensePeriods"
import type { FixedExpensePeriod } from "../../fixedExpenses/types"

const DUE_SOON_DAYS = 7

type DueSoonCardProps = {
  onPress: () => void
}

export function DueSoonCard({ onPress }: DueSoonCardProps) {
  const periodsQuery = useFixedExpensePeriods(true, getCurrentFixedExpensePeriod())
  const due = (periodsQuery.data ?? []).filter(isDueSoon).sort(byDueDate)

  if (periodsQuery.isError || due.length === 0) return null

  const next = due[0]
  const countLabel = due.length === 1
    ? "Tenés 1 gasto fijo por vencer."
    : `Tenés ${due.length} gastos fijos por vencer.`

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Text style={styles.kicker}>Por vencer</Text>
      <Text style={styles.title}>{countLabel}</Text>
      <Text style={styles.detail}>
        {next.category?.icon ? `${next.category.icon} ` : ""}
        {next.name} · {formatMoney(next.remaining)} · vence {formatDueDate(next.dueDate)}
      </Text>
      <Text style={styles.link}>Ver todos</Text>
    </Pressable>
  )
}

function isDueSoon(period: FixedExpensePeriod) {
  if (period.remaining <= 0 || period.status === "paid") return false
  if (period.status === "overdue") return true
  const due = Date.parse(period.dueDate)
  if (!Number.isFinite(due)) return false
  const daysUntilDue = (due - Date.now()) / 86_400_000
  return daysUntilDue <= DUE_SOON_DAYS
}

function byDueDate(left: FixedExpensePeriod, right: FixedExpensePeriod) {
  return left.dueDate.localeCompare(right.dueDate)
}

function formatDueDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  return `${match[3]}/${match[2]}`
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  kicker: {
    color: colors.brand,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 22,
  },
  detail: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: colors.brand,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
})
