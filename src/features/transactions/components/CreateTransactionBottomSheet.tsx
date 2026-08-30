import { forwardRef, useState } from "react"
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewProps,
} from "react-native"
import { BlurView } from "expo-blur"
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetModal,
  BottomSheetView,
  useBottomSheet,
} from "@gorhom/bottom-sheet"
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet"

import { CreateTransactionForm } from "./CreateTransactionForm"

type CreateTransactionBottomSheetProps = {
  onDismiss: () => void
  onSuccess: () => void
}

export const CreateTransactionBottomSheet = forwardRef<
  BottomSheetModal,
  CreateTransactionBottomSheetProps
>(function CreateTransactionBottomSheet({ onDismiss, onSuccess }, ref) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.6}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
      onDismiss={onDismiss}
      backdropComponent={(props) => <CreateTransactionBlurBackdrop {...props} />}
    >
      <BottomSheetView
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <CreateTransactionForm onSuccess={onSuccess} />
      </BottomSheetView>
    </BottomSheetModal>
  )
})

function CreateTransactionBlurBackdrop({ animatedIndex, style }: BottomSheetBackdropProps) {
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
          style={[StyleSheet.absoluteFill, styles.blurOverlay]}
        />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#E6E6E6",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  handleIndicator: {
    backgroundColor: "#1c1c1c",
  },
  blurOverlay: {
    backgroundColor: "rgba(0,0,0,0.12)",
  },
})
