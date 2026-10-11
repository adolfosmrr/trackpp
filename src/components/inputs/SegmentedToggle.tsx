import { useEffect, useRef, useState } from "react"
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native"
import { GlassContainer, GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

import { colors, fonts, radii } from "../../theme"

const INSET = 4
const liquidGlassEnabled = isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

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
  const innerWidth = Math.max(0, containerWidth - INSET * 2)
  const optionWidth = options.length > 0 ? innerWidth / options.length : 0
  const selectedIndex = options.findIndex((option) => option.value === value)
  const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0

  useEffect(() => {
    if (containerWidth === 0 || options.length === 0) {
      return
    }

    const finalPosition = optionWidth * safeSelectedIndex

    if (!hasInitialized.current) {
      translateX.value = finalPosition
      previousIndex.current = safeSelectedIndex
      hasInitialized.current = true
      return
    }

    if (previousIndex.current === safeSelectedIndex) {
      translateX.value = finalPosition
      return
    }

    translateX.value = withSpring(finalPosition, {
      damping: 20,
      stiffness: 380,
      mass: 0.7,
    })
    previousIndex.current = safeSelectedIndex
  }, [containerWidth, optionWidth, options.length, safeSelectedIndex, translateX])

  function handleLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width)
  }

  const animatedCapsuleStyle = useAnimatedStyle(() => ({
    width: optionWidth,
    transform: [{ translateX: translateX.value }],
  }))

  const widthStyle = width !== undefined ? { width } : null
  const capsule = (
    <Animated.View pointerEvents="none" style={[styles.capsule, animatedCapsuleStyle]}>
      {liquidGlassEnabled ? (
        <GlassView
          colorScheme="dark"
          glassEffectStyle="clear"
          isInteractive
          style={styles.capsuleFill}
        />
      ) : (
        <View style={styles.fallbackCapsule} />
      )}
    </Animated.View>
  )
  const segments = options.map((option) => {
    const selected = option.value === value
    return (
      <Pressable
        key={option.value}
        accessibilityLabel={option.label}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => onChange(option.value)}
        style={styles.option}
      >
        <Text
          numberOfLines={1}
          style={[styles.text, selected ? styles.selectedText : styles.unselectedText]}
        >
          {option.label}
        </Text>
      </Pressable>
    )
  })

  if (liquidGlassEnabled) {
    return (
      <GlassContainer
        onLayout={handleLayout}
        spacing={8}
        style={[styles.container, widthStyle]}
      >
        <GlassView
          colorScheme="dark"
          glassEffectStyle="regular"
          pointerEvents="none"
          style={styles.glassBar}
        />
        {capsule}
        {segments}
      </GlassContainer>
    )
  }

  return (
    <View onLayout={handleLayout} style={[styles.container, styles.fallbackContainer, widthStyle]}>
      {capsule}
      {segments}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.pill,
    flexDirection: "row",
    padding: INSET,
  },
  fallbackContainer: {
    backgroundColor: colors.control,
  },
  glassBar: {
    borderRadius: radii.pill,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  capsule: {
    borderRadius: radii.pill,
    bottom: INSET,
    left: INSET,
    position: "absolute",
    top: INSET,
  },
  capsuleFill: {
    borderRadius: radii.pill,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  fallbackCapsule: {
    backgroundColor: "rgba(237, 239, 238, 0.14)",
    borderRadius: radii.pill,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  option: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 1,
  },
  text: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  selectedText: {
    color: colors.brand,
  },
  unselectedText: {
    color: colors.foreground,
  },
})
