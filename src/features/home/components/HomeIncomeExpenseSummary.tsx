import { memo } from "react"
import { StyleSheet, View } from "react-native"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"
import { AnimatedAmount } from "../../../components/animated/AnimatedAmount"
import { formatMoney } from "../../../utils/formatMoney"
import { colors, fonts } from "../../../theme"
import {
  TOP_SUMMARY_LABEL_FONT_SIZE,
  TOP_SUMMARY_MARGIN_BOTTOM,
  TOP_SUMMARY_MARGIN_TOP,
} from "../../../components/layout/topSectionCollapse"

type HomeIncomeExpenseSummaryProps = {
  income: number
  expenses: number
  collapseProgress: SharedValue<number>
}

export const HomeIncomeExpenseSummary = memo(function HomeIncomeExpenseSummary({
  income,
  expenses,
  collapseProgress,
}: HomeIncomeExpenseSummaryProps) {
  const containerStyle = useAnimatedStyle(() => ({
    marginBottom: interpolate(collapseProgress.value, [0, 1], TOP_SUMMARY_MARGIN_BOTTOM),
    marginTop: interpolate(collapseProgress.value, [0, 1], TOP_SUMMARY_MARGIN_TOP),
  }))
  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <SummaryItem collapseProgress={collapseProgress} label="Ingresos" amount={income} tone="income" />
      <SummaryItem collapseProgress={collapseProgress} label="Gastos" amount={expenses} tone="expense" />
    </Animated.View>
  )
})

function SummaryItem({
  label,
  amount,
  collapseProgress,
  tone,
}: {
  label: string
  amount: number
  collapseProgress: SharedValue<number>
  tone: "income" | "expense"
}) {
  const labelStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(collapseProgress.value, [0, 1], TOP_SUMMARY_LABEL_FONT_SIZE),
    lineHeight: 22,
  }))

  return (
    <View style={styles.item}>
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      <AnimatedAmount
        value={amount}
        formatter={(value) => formatMoney(value)}
        textProps={{
          adjustsFontSizeToFit: true,
          minimumFontScale: 0.8,
          numberOfLines: 1,
        }}
        style={[styles.amount, tone === "expense" ? styles.expenseAmount : styles.incomeAmount]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    columnGap: 40,
    flexDirection: "row",
    marginBottom: TOP_SUMMARY_MARGIN_BOTTOM[0],
    marginTop: TOP_SUMMARY_MARGIN_TOP[0],
  },
  item: {
    flexShrink: 1,
  },
  label: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 18,
    lineHeight: 22,
  },
  amount: {
    flexShrink: 1,
    fontFamily: fonts.monoMedium,
    fontSize: 18,
  },
  incomeAmount: {
    color: colors.brand,
  },
  expenseAmount: {
    color: colors.destructive,
  },
})
