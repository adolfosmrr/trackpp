import { Pressable, StyleSheet, View } from "react-native"

import { GlassButton } from "../../../components/buttons/GlassButton"
import { ListSection } from "../../../components/layout/ListSection"
import { AppText } from "../../../components/text/AppText"
import { useFormatMoney } from "../../households/hooks/useFormatMoney"
import { colors, radii } from "../../../theme"
import { parseLocalDate } from "../../../utils/localDate"
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
  const format = useFormatMoney()
  const periodsQuery = useFixedExpensePeriods(true, getCurrentFixedExpensePeriod())
  const due = (periodsQuery.data ?? []).filter(isDueSoon).sort(byDueDate)

  if (periodsQuery.isError || due.length === 0) return null

  const next = due[0]
  const countLabel = due.length === 1
    ? "Tienes 1 gasto fijo por vencer."
    : `Tienes ${due.length} gastos fijos por vencer.`

  return (
    <ListSection>
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.copy}>
        <AppText tone="brand" variant="caption">Por vencer</AppText>
        <AppText variant="subtitle">{countLabel}</AppText>
        <AppText tone="muted" variant="body">
          {next.category?.icon ? `${next.category.icon} ` : ""}
          {next.name} · {format(next.remaining)} · vence {formatDueDate(next.dueDate)}
        </AppText>
      </Pressable>
      <GlassButton
        accessibilityLabel="Ver todos"
        fallbackStyle={styles.linkFallback}
        label="Ver todos"
        onPress={onPress}
      />
    </View>
    </ListSection>
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
  const parsed = parseLocalDate(value)
  if (!parsed) return value
  const day = String(parsed.getDate()).padStart(2, "0")
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}`
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  copy: {
    gap: 6,
  },
  linkFallback: {
    alignSelf: "flex-start",
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
})
