import { memo, useEffect, useState } from "react"
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
import { formatMoney } from "../../../utils/formatMoney"
import { colors, fonts } from "../../../theme"
import {
  TOP_BALANCE_AMOUNT_HEIGHT,
  TOP_BALANCE_FONT_SIZE,
  TOP_BALANCE_LABEL_HEIGHT,
  TOP_BALANCE_MARGIN_TOP,
} from "../../../components/layout/topSectionCollapse"

type HomeBalanceProps = {
  balance: number
  collapseProgress: SharedValue<number>
  isCollapsed: boolean
}

export const HomeBalance = memo(function HomeBalance({
  balance,
  collapseProgress,
  isCollapsed,
}: HomeBalanceProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const reduceMotionEnabled = useReducedMotion()
  const visibilityProgress = useSharedValue(1)
  const containerStyle = useAnimatedStyle(() => ({
    marginTop: interpolate(collapseProgress.value, [0, 1], TOP_BALANCE_MARGIN_TOP),
  }))
  const amountStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(collapseProgress.value, [0, 1], TOP_BALANCE_FONT_SIZE),
    lineHeight: interpolate(collapseProgress.value, [0, 1], TOP_BALANCE_AMOUNT_HEIGHT),
  }))
  const amountHolderStyle = useAnimatedStyle(() => ({
    height: interpolate(collapseProgress.value, [0, 1], TOP_BALANCE_AMOUNT_HEIGHT),
  }))
  const collapsedVisibilityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.6, 1], [0, 0, 1]),
  }))
  const expandedVisibilityStyle = useAnimatedStyle(() => ({
    height: interpolate(collapseProgress.value, [0, 1], TOP_BALANCE_LABEL_HEIGHT),
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
          hitSlop={14}
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
            formatter={(value) => formatMoney(value)}
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
            hitSlop={14}
            onPress={() => setIsBalanceVisible((visible) => !visible)}
          >
            {isBalanceVisible ? <BalanceVisibleIcon /> : <BalanceHiddenIcon />}
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginTop: 60,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    height: TOP_BALANCE_LABEL_HEIGHT[0],
  },
  label: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  visibilityButton: {
    marginLeft: 15,
  },
  amount: {
    color: colors.foreground,
    fontFamily: fonts.monoSemibold,
    fontSize: 60,
    letterSpacing: -1,
    lineHeight: 66,
  },
  amountRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  amountHolder: {
    height: TOP_BALANCE_AMOUNT_HEIGHT[0],
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
