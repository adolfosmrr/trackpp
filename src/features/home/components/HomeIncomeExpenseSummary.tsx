import { StyleSheet, Text, View } from "react-native"

type HomeIncomeExpenseSummaryProps = {
  income: number
  expenses: number
}

export function HomeIncomeExpenseSummary({
  income,
  expenses,
}: HomeIncomeExpenseSummaryProps) {
  return (
    <View style={styles.container}>
      <SummaryItem label="Ingresos" amount={income} />
      <SummaryItem label="Gastos" amount={expenses} />
    </View>
  )
}

function SummaryItem({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
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
