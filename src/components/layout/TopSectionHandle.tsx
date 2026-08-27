import { Pressable, StyleSheet } from "react-native"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"

type TopSectionHandleProps = {
  onPress?: () => void
  collapseProgress?: SharedValue<number>
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function TopSectionHandle({ onPress, collapseProgress }: TopSectionHandleProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: collapseProgress ? interpolate(collapseProgress.value, [0, 1], [20, 120]) : 20,
  }))

  return (
    <AnimatedPressable
      accessibilityLabel="Control del panel superior"
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={[styles.container, styles.handle, animatedStyle]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginBottom: 10,
  },
  handle: {
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    height: 5,
    width: 20,
  },
})
