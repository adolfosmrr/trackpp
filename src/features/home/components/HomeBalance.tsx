import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"

import { BalanceHiddenIcon } from "../../../components/icons/BalanceHiddenIcon"
import { BalanceVisibleIcon } from "../../../components/icons/BalanceVisibleIcon"
import { VerticalTextTransition } from "../../../components/text/VerticalTextTransition"

type HomeBalanceProps = {
  balance: number
  currencySymbol?: string
  collapseProgress: SharedValue<number>
  isCollapsed: boolean
}

export function HomeBalance({
  balance,
  currencySymbol = "$",
  collapseProgress,
  isCollapsed,
}: HomeBalanceProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const formattedBalance = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(balance)
  const displayBalance = isBalanceVisible
    ? `${currencySymbol} ${formattedBalance}`
    : "******"
  const containerStyle = useAnimatedStyle(() => ({
    marginTop: interpolate(collapseProgress.value, [0, 1], [60, 20]),
  }))
  const amountStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(collapseProgress.value, [0, 1], [60, 40]),
    lineHeight: interpolate(collapseProgress.value, [0, 1], [66, 46]),
  }))
  const amountHolderStyle = useAnimatedStyle(() => ({
    height: interpolate(collapseProgress.value, [0, 1], [66, 46]),
  }))
  const collapsedVisibilityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.6, 1], [0, 0, 1]),
  }))
  const expandedVisibilityStyle = useAnimatedStyle(() => ({
    height: interpolate(collapseProgress.value, [0, 1], [22, 0]),
    opacity: interpolate(collapseProgress.value, [0, 0.4, 1], [1, 1, 0]),
  }))

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View pointerEvents={isCollapsed ? "none" : "auto"} style={[styles.labelRow, expandedVisibilityStyle]}>
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
      </Animated.View>
      <View style={styles.amountRow}>
        <Animated.View style={[styles.amountHolder, amountHolderStyle]}>
          <VerticalTextTransition
            text={displayBalance}
            animatedStyle={amountStyle}
            fitContent
            style={styles.amount}
            textProps={{
              adjustsFontSizeToFit: true,
              minimumFontScale: 0.7,
              numberOfLines: 1,
            }}
          />
        </Animated.View>
        <Animated.View pointerEvents={isCollapsed ? "auto" : "none"} style={[styles.collapsedVisibility, collapsedVisibilityStyle]}>
          <Pressable
            accessibilityLabel={isBalanceVisible ? "Ocultar balance" : "Mostrar balance"}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsBalanceVisible((visible) => !visible)}
          >
            {isBalanceVisible ? <BalanceVisibleIcon /> : <BalanceHiddenIcon />}
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
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
  amountRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  amountHolder: {
    overflow: "hidden",
  },
  collapsedVisibility: {
    marginLeft: 15,
  },
})
