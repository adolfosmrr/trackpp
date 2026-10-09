import { memo, useMemo } from "react"
import { StyleSheet, View } from "react-native"
import { Gesture, GestureDetector, type PanGesture } from "react-native-gesture-handler"
import Animated, { interpolate, runOnJS, useAnimatedStyle, type SharedValue } from "react-native-reanimated"

import { colors, radii } from "../../theme"

type TopSectionHandleProps = {
  collapseProgress: SharedValue<number>
  onPress?: () => void
  pan: PanGesture
}

const HANDLE_HEIGHT = 4
const HANDLE_HIT_SLOP = { top: 20, bottom: 20, left: 12, right: 12 }

export const TopSectionHandle = memo(function TopSectionHandle({
  collapseProgress,
  onPress,
  pan,
}: TopSectionHandleProps) {
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(12)
        .hitSlop(HANDLE_HIT_SLOP)
        .requireExternalGestureToFail(pan)
        .onEnd((_event, success) => {
          if (success && onPress) runOnJS(onPress)()
        }),
    [onPress, pan]
  )
  const handleStyle = useAnimatedStyle(() => ({
    width: interpolate(collapseProgress.value, [0, 1], [36, 120]),
  }))

  return (
    <GestureDetector gesture={tap}>
      <View
        accessibilityLabel="Control del panel superior"
        accessibilityRole="button"
        hitSlop={HANDLE_HIT_SLOP}
        style={styles.hitArea}
      >
        <Animated.View style={[styles.handle, handleStyle]} />
      </View>
    </GestureDetector>
  )
})

const styles = StyleSheet.create({
  hitArea: {
    alignItems: "center",
    alignSelf: "center",
    height: HANDLE_HEIGHT,
    justifyContent: "center",
    marginBottom: 10,
    width: "100%",
  },
  handle: {
    backgroundColor: colors.mutedForeground,
    borderRadius: radii.pill,
    height: HANDLE_HEIGHT,
    width: 36,
  },
})
