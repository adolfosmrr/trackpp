import { memo } from "react"
import { StyleSheet, View } from "react-native"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"
import { AnimatedAmount } from "../../../components/animated/AnimatedAmount"
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
    transformOrigin: "left center",
    transform: [
      {
        scale: interpolate(
          collapseProgress.value,
          [0, 1],
          [1, TOP_SUMMARY_LABEL_FONT_SIZE[1] / TOP_SUMMARY_LABEL_FONT_SIZE[0]]
        ),
      },
    ],
  }))

  return (
    <View style={styles.item}>
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      <AnimatedAmount
        value={amount}
        formatter={(value) => `$ ${formatAmount(value)}`}
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

function formatAmount(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(amount)
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
    fontSize: TOP_SUMMARY_LABEL_FONT_SIZE[0],
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
