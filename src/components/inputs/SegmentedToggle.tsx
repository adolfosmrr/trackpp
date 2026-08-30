import { useEffect, useRef, useState } from "react"
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"

export type SegmentedToggleOption<T extends string> = {
  value: T
  label: string
}

export type SegmentedToggleProps<T extends string> = {
  value: T
  options: readonly SegmentedToggleOption<T>[]
  onChange: (value: T) => void
  width?: number | `${number}%`
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  width,
}: SegmentedToggleProps<T>) {
  const [containerWidth, setContainerWidth] = useState(0)
  const translateX = useSharedValue(0)
  const previousIndex = useRef(0)
  const hasInitialized = useRef(false)
  const innerWidth = Math.max(0, containerWidth - 8)
  const optionWidth = options.length > 0 ? innerWidth / options.length : 0
  const selectedIndex = options.findIndex((option) => option.value === value)
  const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0

  useEffect(() => {
    if (containerWidth === 0 || options.length === 0) {
      return
    }

    const finalPosition = optionWidth * safeSelectedIndex

    if (!hasInitialized.current || previousIndex.current === safeSelectedIndex) {
      translateX.value = finalPosition
      hasInitialized.current = true
      return
    }

    const direction = safeSelectedIndex > previousIndex.current ? 1 : -1
    const overshootPosition = finalPosition + direction * optionWidth * 0.03

    translateX.value = withSequence(
      withTiming(overshootPosition, {
        duration: 320,
        easing: Easing.inOut(Easing.cubic),
      }),
      withSpring(finalPosition, {
        damping: 18,
        stiffness: 500,
        mass: 1.6,
      }),
    )
    previousIndex.current = safeSelectedIndex
  }, [containerWidth, optionWidth, options.length, safeSelectedIndex, translateX])

  function handleLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width)
  }

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    width: optionWidth,
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <View
      onLayout={handleLayout}
      style={[styles.container, width !== undefined && { width }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.indicator, animatedIndicatorStyle]}
      />
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityLabel={option.label}
          accessibilityRole="button"
          accessibilityState={{ selected: option.value === value }}
          onPress={() => onChange(option.value)}
          style={styles.option}
        >
          <Text
            style={[
              styles.text,
              option.value === value ? styles.selectedText : styles.unselectedText,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 100,
    backgroundColor: "#F3F3F3",
  },
  indicator: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 50,
    backgroundColor: "#1C1C1C",
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    zIndex: 1,
  },
  text: {
    fontFamily: "FamiljenGrotesk-Medium",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  unselectedText: {
    color: "#1C1C1C",
  },
})
