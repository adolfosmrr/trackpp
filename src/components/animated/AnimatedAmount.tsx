import { useEffect, useRef, useState } from "react"
import { type StyleProp, type TextProps, type TextStyle } from "react-native"
import Animated, {
  Easing,
  type AnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated"

const FRAME_INTERVAL = 1000 / 30
const easeOutCubic = Easing.out(Easing.cubic)

type AnimatedAmountProps = {
  value: number
  formatter: (value: number) => string
  style?: StyleProp<TextStyle>
  animatedStyle?: AnimatedStyle<TextStyle>
  textProps?: Omit<TextProps, "children" | "style">
  duration?: number
}

export function AnimatedAmount({
  value,
  formatter,
  style,
  animatedStyle,
  textProps,
  duration = 650,
}: AnimatedAmountProps) {
  const reduceMotionEnabled = useReducedMotion()
  const [displayValue, setDisplayValue] = useState(value)
  const visualValue = useRef(value)
  const formatterRef = useRef(formatter)
  const frameRef = useRef<number | null>(null)

  formatterRef.current = formatter

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    if (value === visualValue.current) return

    if (reduceMotionEnabled || duration <= 0) {
      visualValue.current = value
      setDisplayValue(value)
      return
    }

    const startValue = visualValue.current
    const targetValue = value
    const startedAt = performance.now()
    let lastRenderedAt = startedAt - FRAME_INTERVAL

    const update = (now: number) => {
      const elapsed = now - startedAt

      if (elapsed >= duration) {
        visualValue.current = targetValue
        setDisplayValue(targetValue)
        frameRef.current = null
        return
      }

      if (now - lastRenderedAt >= FRAME_INTERVAL) {
        const progress = Math.min(1, elapsed / duration)
        const easedProgress = easeOutCubic(progress)
        const currentValue = startValue + (targetValue - startValue) * easedProgress

        visualValue.current = currentValue
        setDisplayValue(Math.round(currentValue))
        lastRenderedAt = now
      }

      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [duration, reduceMotionEnabled, value])

  useEffect(() => () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <Animated.Text
      {...textProps}
      style={[style, animatedStyle]}
    >
      {formatterRef.current(displayValue)}
    </Animated.Text>
  )
}
