import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { BalanceHiddenIcon } from "../../../components/icons/BalanceHiddenIcon"
import { BalanceVisibleIcon } from "../../../components/icons/BalanceVisibleIcon"
import { VerticalTextTransition } from "../../../components/text/VerticalTextTransition"

type HomeBalanceProps = {
  balance: number
  currencySymbol?: string
}

export function HomeBalance({
  balance,
  currencySymbol = "$",
}: HomeBalanceProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const formattedBalance = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(balance)
  const displayBalance = isBalanceVisible
    ? `${currencySymbol} ${formattedBalance}`
    : "******"

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Balance</Text>
        <Pressable
          accessibilityLabel={isBalanceVisible ? "Ocultar balance" : "Mostrar balance"}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setIsBalanceVisible((visible) => !visible)}
          style={styles.visibilityButton}
        >
          {isBalanceVisible ? <BalanceVisibleIcon /> : <BalanceHiddenIcon />}
        </Pressable>
      </View>
      <VerticalTextTransition
        text={displayBalance}
        style={styles.amount}
        textProps={{
          adjustsFontSizeToFit: true,
          minimumFontScale: 0.7,
          numberOfLines: 1,
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 60,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  label: {
    color: "#FFFFFF",
    fontFamily: "Satoshi-Regular",
    fontSize: 18,
    opacity: 0.5,
  },
  visibilityButton: {
    marginLeft: 15,
  },
  amount: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 60,
    lineHeight: 66,
  },
})
