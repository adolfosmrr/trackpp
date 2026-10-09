import { StyleSheet, Text, View } from "react-native"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"
import { AnimatedAmount } from "../../../components/animated/AnimatedAmount"
import { colors, fonts } from "../../../theme"

type HomeIncomeExpenseSummaryProps = {
  income: number
  expenses: number
  collapseProgress: SharedValue<number>
}

export function HomeIncomeExpenseSummary({
  income,
  expenses,
  collapseProgress,
}: HomeIncomeExpenseSummaryProps) {
  const containerStyle = useAnimatedStyle(() => ({
    marginBottom: interpolate(collapseProgress.value, [0, 1], [10, 30]),
    marginTop: interpolate(collapseProgress.value, [0, 1], [50, 10]),
  }))
  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <SummaryItem collapseProgress={collapseProgress} label="Ingresos" amount={income} tone="income" />
      <SummaryItem collapseProgress={collapseProgress} label="Gastos" amount={expenses} tone="expense" />
    </Animated.View>
  )
}

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
    fontSize: interpolate(collapseProgress.value, [0, 1], [18, 16]),
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
    marginTop: 30,
  },
  item: {
    flexShrink: 1,
  },
  label: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 13,
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
