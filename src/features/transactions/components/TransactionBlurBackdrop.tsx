import { useState } from "react"
import { Pressable, StyleSheet, View, type ViewProps } from "react-native"
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { useBottomSheet } from "@gorhom/bottom-sheet"
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet"

export function TransactionBlurBackdrop({
  animatedIndex,
  style,
}: BottomSheetBackdropProps) {
  const { close } = useBottomSheet()
  const [pointerEvents, setPointerEvents] = useState<ViewProps["pointerEvents"]>("none")
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(
        animatedIndex.value,
        [-1, 0],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    }),
    [animatedIndex],
  )

  useAnimatedReaction(
    () => animatedIndex.value <= -1,
    (isHidden, previous) => {
      if (isHidden === previous) return
      runOnJS(setPointerEvents)(isHidden ? "none" : "auto")
    },
    [animatedIndex],
  )

  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[StyleSheet.absoluteFill, style, animatedStyle]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => close()}>
        <BlurView
          intensity={50}
          tint="dark"
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.overlay]}
        />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.12)",
  },
})
