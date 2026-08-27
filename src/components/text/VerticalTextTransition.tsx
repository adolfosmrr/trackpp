import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native"
import { useEffect, useRef, useState } from "react"
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from "react-native-reanimated"

type VerticalTextTransitionProps = {
  text: string
  style?: StyleProp<TextStyle>
  animatedStyle?: AnimatedStyle<TextStyle>
  fitContent?: boolean
  duration?: number
  distance?: number
  textProps?: Omit<TextProps, "children" | "style">
}

export function VerticalTextTransition({
  text,
  style,
  animatedStyle,
  fitContent = false,
  duration = 220,
  distance = 16,
  textProps,
}: VerticalTextTransitionProps) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)
  const [currentText, setCurrentText] = useState(text)
  const [previousText, setPreviousText] = useState<string | null>(null)
  const transitionId = useRef(0)
  const progress = useSharedValue(1)

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
    if (text === currentText) return

    transitionId.current += 1
    const nextTransitionId = transitionId.current

    if (reduceMotionEnabled) {
      progress.value = 1
      setPreviousText(null)
      setCurrentText(text)
      return
    }

    setPreviousText(currentText)
    setCurrentText(text)
    progress.value = 0
    progress.value = withTiming(
      1,
      {
        duration,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(finishTransition)(nextTransitionId)
        }
      }
    )

    function finishTransition(completedTransitionId: number) {
      if (transitionId.current === completedTransitionId) {
        setPreviousText(null)
      }
    }
  }, [currentText, duration, progress, reduceMotionEnabled, text])

  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateY: -distance * progress.value }],
  }))
  const incomingStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: distance * (1 - progress.value) }],
  }))
  const flattenedStyle = StyleSheet.flatten(style) ?? {}
  const lineHeight = typeof flattenedStyle.lineHeight === "number"
    ? flattenedStyle.lineHeight
    : typeof flattenedStyle.fontSize === "number"
      ? flattenedStyle.fontSize * 1.2
      : undefined

  return (
    <View style={[styles.wrapper, lineHeight ? { height: lineHeight } : null]}>
      {previousText ? (
        <Animated.Text {...textProps} style={[fitContent ? styles.fitContentPreviousLayer : styles.layer, style, animatedStyle, outgoingStyle]}>
          {previousText}
        </Animated.Text>
      ) : null}
      <Animated.Text {...textProps} style={[fitContent ? styles.fitContentIncomingLayer : styles.layer, style, animatedStyle, incomingStyle]}>
        {currentText}
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    position: "relative",
  },
  layer: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  fitContentPreviousLayer: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  fitContentIncomingLayer: {
    position: "relative",
  },
})
