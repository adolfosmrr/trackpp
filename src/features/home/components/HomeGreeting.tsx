import { memo } from "react"
import { StyleSheet } from "react-native"

import { colors, fonts } from "../../../theme"
import { TOP_GREETING_HEIGHT } from "../../../components/layout/topSectionCollapse"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"

type HomeGreetingProps = {
  displayName?: string
  collapseProgress: SharedValue<number>
}

export const HomeGreeting = memo(function HomeGreeting({ displayName, collapseProgress }: HomeGreetingProps) {
  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(collapseProgress.value, [0, 1], TOP_GREETING_HEIGHT),
  }))
  const verticalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.75, 1], [1, 0, 0]),
    transform: [{ translateY: interpolate(collapseProgress.value, [0, 1], [0, -10]) }],
  }))
  const horizontalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.25, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(collapseProgress.value, [0, 1], [10, 0]) }],
  }))

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.layout, verticalStyle]}>
        <Animated.Text style={styles.helloText}>Hola</Animated.Text>
        {displayName ? <Animated.Text style={styles.nameText}>{displayName}</Animated.Text> : null}
      </Animated.View>
      <Animated.View style={[styles.horizontalLayout, horizontalStyle]}>
        <Animated.Text style={styles.collapsedHelloText}>Hola</Animated.Text>
        {displayName ? <Animated.Text style={styles.collapsedNameText}>{displayName}</Animated.Text> : null}
      </Animated.View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    height: TOP_GREETING_HEIGHT[0],
    marginTop: 20,
    position: "relative",
  },
  layout: {
    left: 0,
    position: "absolute",
    top: 0,
  },
  horizontalLayout: {
    alignItems: "center",
    flexDirection: "row",
    left: 0,
    position: "absolute",
    top: 0,
  },
  helloText: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 30,
    lineHeight: 34,
  },
  nameText: {
    color: colors.foreground,
    fontFamily: fonts.sans,
    fontSize: 40,
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  collapsedHelloText: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 20,
    lineHeight: 20,
  },
  collapsedNameText: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 20,
    lineHeight: 20,
    marginLeft: 8,
  },
})
