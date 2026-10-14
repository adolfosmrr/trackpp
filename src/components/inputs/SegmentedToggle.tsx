import { useEffect, useRef } from "react"
import {
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
} from "react-native"
import SegmentedControl, {
  type FontStyle,
  type NativeSegmentedControlIOSChangeEvent,
} from "@react-native-segmented-control/segmented-control"
import { GlassContainer, GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated"

import { colors, fonts, layout, radii, typography } from "../../theme"

type SegmentedToggleOption<T extends string> = {
  value: T
  label: string
}

type SegmentedToggleProps<T extends string> = {
  value: T
  options: readonly SegmentedToggleOption<T>[]
  onChange: (value: T) => void
  width?: number | `${number}%`
}

const SEGMENT_TEXT = "#FFFFFF"
const SELECTED_SEGMENT_TEXT = colors.brand
const LENS_INSET = layout.segmentedOffset

const segmentFont: FontStyle = {
  color: SEGMENT_TEXT,
  fontFamily: fonts.sansMedium,
  fontSize: typography.sectionTitle.fontSize,
}

const selectedSegmentFont: FontStyle = {
  color: colors.brandForeground,
  fontFamily: fonts.sansMedium,
  fontSize: typography.sectionTitle.fontSize,
}

const liquidGlassEnabled =
  Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

const lensSpring = { damping: 22, stiffness: 260, mass: 0.8 }

function indexFromX(x: number, width: number, count: number) {
  "worklet"

  if (width <= 0 || count <= 0) return 0
  const segment = (width - LENS_INSET * 2) / count
  if (segment <= 0) return 0
  const raw = (x - LENS_INSET) / segment
  return Math.min(count - 1, Math.max(0, raw))
}

function SegmentLabel({
  index,
  label,
  progress,
}: {
  index: number
  label: string
  progress: SharedValue<number>
}) {
  const colorStyle = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - index)
    const covered = Math.min(Math.max(1 - distance, 0), 1)
    return {
      color: interpolateColor(covered, [0, 1], [SEGMENT_TEXT, SELECTED_SEGMENT_TEXT]),
    }
  })

  return <Animated.Text style={[styles.label, colorStyle]}>{label}</Animated.Text>
}

function GlassSegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  width,
}: SegmentedToggleProps<T>) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )
  const progress = useSharedValue(selectedIndex)
  const trackWidth = useSharedValue(0)
  const didMount = useRef(false)

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      progress.value = selectedIndex
      return
    }
    progress.value = withSpring(selectedIndex, lensSpring)
  }, [progress, selectedIndex])

  function commit(index: number) {
    const option = options[index]
    if (!option || option.value === value) return
    onChange(option.value)
  }

  function handleLayout(event: LayoutChangeEvent) {
    trackWidth.value = event.nativeEvent.layout.width
  }

  const lensStyle = useAnimatedStyle(() => {
    const segment =
      options.length > 0
        ? Math.max(trackWidth.value - LENS_INSET * 2, 0) / options.length
        : 0
    return {
      width: segment,
      transform: [{ translateX: LENS_INSET + progress.value * segment }],
    }
  })

  const pan = Gesture.Pan()
    .failOffsetY([-16, 16])
    .onBegin((event) => {
      progress.value = indexFromX(event.x, trackWidth.value, options.length)
    })
    .onUpdate((event) => {
      progress.value = indexFromX(event.x, trackWidth.value, options.length)
    })
    .onEnd((event) => {
      const next = Math.round(indexFromX(event.x, trackWidth.value, options.length))
      progress.value = withSpring(next, lensSpring)
      runOnJS(commit)(next)
    })

  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityActions={[
          { name: "increment" },
          { name: "decrement" },
        ]}
        accessibilityLabel={options.map((option) => option.label).join(", ")}
        accessibilityRole="adjustable"
        accessibilityValue={{ text: options[selectedIndex]?.label ?? "" }}
        onAccessibilityAction={(event) => {
          const direction = event.nativeEvent.actionName === "increment" ? 1 : -1
          const next = Math.min(
            options.length - 1,
            Math.max(0, selectedIndex + direction)
          )
          progress.value = withSpring(next, lensSpring)
          commit(next)
        }}
        onLayout={handleLayout}
        style={[styles.track, { width }]}
      >
        <GlassContainer spacing={layout.tabBarPill} style={StyleSheet.absoluteFill}>
          <GlassView
            colorScheme="dark"
            glassEffectStyle="regular"
            pointerEvents="none"
            style={styles.glassFill}
          />
          <Animated.View pointerEvents="none" style={[styles.lens, lensStyle]}>
            <GlassView
              colorScheme="dark"
              glassEffectStyle="clear"
              isInteractive
              pointerEvents="none"
              style={styles.glassFill}
            />
          </Animated.View>
        </GlassContainer>
        <View pointerEvents="none" style={styles.labels}>
          {options.map((option, index) => (
            <SegmentLabel
              index={index}
              key={option.value}
              label={option.label}
              progress={progress}
            />
          ))}
        </View>
      </View>
    </GestureDetector>
  )
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  width,
}: SegmentedToggleProps<T>) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  function handleChange(
    event: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>
  ) {
    const option = options[event.nativeEvent.selectedSegmentIndex]
    if (!option) return
    onChange(option.value)
  }

  return (
    <View style={[styles.shift, { width }]}>
      {liquidGlassEnabled ? (
        <GlassSegmentedToggle
          onChange={onChange}
          options={options}
          value={value}
          width="100%"
        />
      ) : (
        <SegmentedControl
          activeFontStyle={selectedSegmentFont}
          appearance="dark"
          fontStyle={segmentFont}
          onChange={handleChange}
          selectedIndex={selectedIndex}
          style={styles.fallback}
          tintColor={colors.brand}
          values={options.map((option) => option.label)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  shift: {
    marginTop: layout.segmentedOffset,
  },
  fallback: {
    height: layout.tabBarPill,
    width: "100%",
  },
  track: {
    height: layout.tabBarPill,
    justifyContent: "center",
  },
  glassFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.pill,
  },
  lens: {
    position: "absolute",
    top: LENS_INSET,
    bottom: LENS_INSET,
    left: 0,
  },
  labels: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: LENS_INSET,
  },
  label: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    textAlign: "center",
  },
})
