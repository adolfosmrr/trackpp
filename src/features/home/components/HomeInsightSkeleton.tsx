import { AccessibilityInfo, StyleSheet, View } from "react-native"
import { useEffect, useState } from "react"
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

export function HomeInsightSkeleton() {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)
  const opacity = useSharedValue(0.13)

  useEffect(() => {
    let mounted = true

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotionEnabled(enabled)
    })

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled
    )

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    cancelAnimation(opacity)

    if (reduceMotionEnabled) {
      opacity.value = 0.13
      return
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.18, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    )
  }, [opacity, reduceMotionEnabled])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <View accessibilityLabel="Cargando insight financiero" style={styles.container}>
      <Animated.View style={[styles.line, styles.firstLine, animatedStyle]} />
      <Animated.View style={[styles.line, styles.secondLine, animatedStyle]} />
      <Animated.View style={[styles.line, styles.thirdLine, animatedStyle]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 70,
  },
  line: {
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    height: 18,
  },
  firstLine: {
    width: "90%",
  },
  secondLine: {
    marginTop: 8,
    width: "78%",
  },
  thirdLine: {
    marginTop: 8,
    width: "55%",
  },
})
