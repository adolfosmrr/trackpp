import { StyleSheet, Text, View } from "react-native"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"

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
      <SummaryItem collapseProgress={collapseProgress} label="Ingresos" amount={income} />
      <SummaryItem collapseProgress={collapseProgress} label="Gastos" amount={expenses} />
    </Animated.View>
  )
}

function SummaryItem({ label, amount, collapseProgress }: { label: string; amount: number; collapseProgress: SharedValue<number> }) {
  const labelStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(collapseProgress.value, [0, 1], [18, 16]),
  }))

  return (
    <View style={styles.item}>
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        numberOfLines={1}
        style={styles.amount}
      >
        $ {formatAmount(amount)}
      </Text>
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
    color: "#FFFFFF",
    fontFamily: "Satoshi-Regular",
    fontSize: 18,
    opacity: 0.5,
  },
  amount: {
    color: "#FFFFFF",
    flexShrink: 1,
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 20,
  },
})
