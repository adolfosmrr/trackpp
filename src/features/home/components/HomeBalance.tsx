import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated"

import { BalanceHiddenIcon } from "../../../components/icons/BalanceHiddenIcon"
import { BalanceVisibleIcon } from "../../../components/icons/BalanceVisibleIcon"
import { AnimatedAmount } from "../../../components/animated/AnimatedAmount"

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
  const reduceMotionEnabled = useReducedMotion()
  const visibilityProgress = useSharedValue(1)
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
  const amountVisibilityStyle = useAnimatedStyle(() => ({
    opacity: visibilityProgress.value,
  }))
  const hiddenAmountVisibilityStyle = useAnimatedStyle(() => ({
    opacity: 1 - visibilityProgress.value,
  }))

  useEffect(() => {
    visibilityProgress.value = reduceMotionEnabled
      ? isBalanceVisible ? 1 : 0
      : withTiming(isBalanceVisible ? 1 : 0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        })
  }, [isBalanceVisible, reduceMotionEnabled, visibilityProgress])

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
          <AnimatedAmount
            value={balance}
            formatter={(value) => `${currencySymbol} ${formatAmount(value)}`}
            animatedStyle={[amountStyle, amountVisibilityStyle]}
            style={styles.amount}
            textProps={{
              adjustsFontSizeToFit: true,
              minimumFontScale: 0.7,
              numberOfLines: 1,
            }}
          />
          <Animated.Text
            style={[styles.amount, amountStyle, styles.hiddenAmount, hiddenAmountVisibilityStyle]}
          >
            ******
          </Animated.Text>
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

function formatAmount(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(amount)
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
    position: "relative",
  },
  hiddenAmount: {
    left: 0,
    position: "absolute",
    top: 0,
  },
  collapsedVisibility: {
    marginLeft: 15,
  },
})
