import { memo, useMemo } from "react"
import { StyleSheet, View } from "react-native"
import { Gesture, GestureDetector, type PanGesture } from "react-native-gesture-handler"
import { runOnJS } from "react-native-reanimated"

import { colors, radii } from "../../theme"

type TopSectionHandleProps = {
  onPress?: () => void
  pan: PanGesture
}

const HANDLE_HIT_HEIGHT = 44

export const TopSectionHandle = memo(function TopSectionHandle({
  onPress,
  pan,
}: TopSectionHandleProps) {
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(12)
        .requireExternalGestureToFail(pan)
        .onEnd((_event, success) => {
          if (success && onPress) runOnJS(onPress)()
        }),
    [onPress, pan]
  )

  return (
    <GestureDetector gesture={tap}>
      <View
        accessibilityLabel="Control del panel superior"
        accessibilityRole="button"
        style={styles.hitArea}
      >
        <View style={styles.handle} />
      </View>
    </GestureDetector>
  )
})

const styles = StyleSheet.create({
  hitArea: {
    alignItems: "center",
    height: HANDLE_HIT_HEIGHT,
    justifyContent: "center",
    width: "100%",
  },
  handle: {
    backgroundColor: colors.mutedForeground,
    borderRadius: radii.pill,
    height: 4,
    width: 36,
  },
})
