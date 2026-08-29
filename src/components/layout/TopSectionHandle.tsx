import { StyleSheet } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated"

type TopSectionHandleProps = {
  onPress?: () => void
  onDragEnd?: (collapsed: boolean) => void
  collapseProgress: SharedValue<number>
  interactive?: boolean
  reduceMotionEnabled?: boolean
}

const DRAG_COLLAPSE_DISTANCE = 180
const FLICK_VELOCITY_THRESHOLD = 500

export function TopSectionHandle({
  onPress,
  onDragEnd,
  collapseProgress,
  interactive = true,
  reduceMotionEnabled = false,
}: TopSectionHandleProps) {
  const startProgress = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => ({
    width: interpolate(collapseProgress.value, [0, 1], [20, 120]),
  }))
  const pan = Gesture.Pan()
    .hitSlop(12)
    .onStart(() => {
      cancelAnimation(collapseProgress)
      startProgress.value = collapseProgress.value
    })
    .onUpdate((event) => {
      collapseProgress.value = Math.min(
        1,
        Math.max(0, startProgress.value - event.translationY / DRAG_COLLAPSE_DISTANCE)
      )
    })
    .onEnd((event) => {
      const target = event.velocityY < -FLICK_VELOCITY_THRESHOLD
        ? 1
        : event.velocityY > FLICK_VELOCITY_THRESHOLD
          ? 0
          : collapseProgress.value >= 0.5 ? 1 : 0

      if (reduceMotionEnabled) {
        collapseProgress.value = target
        if (onDragEnd) runOnJS(onDragEnd)(target === 1)
        return
      }

      collapseProgress.value = withTiming(target, { duration: 200 }, (finished) => {
        if (finished && onDragEnd) runOnJS(onDragEnd)(target === 1)
      })
    })
  const tap = Gesture.Tap()
    .hitSlop(12)
    .onEnd((_event, success) => {
      if (success && onPress) runOnJS(onPress)()
    })
  const gesture = Gesture.Exclusive(pan, tap)
  const handle = (
    <Animated.View
      accessibilityLabel={interactive ? "Control del panel superior" : undefined}
      accessibilityRole={interactive ? "button" : undefined}
      style={[styles.container, styles.handle, animatedStyle]}
    />
  )

  if (!interactive) {
    return handle
  }

  return (
    <GestureDetector gesture={gesture}>
      {handle}
    </GestureDetector>
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
