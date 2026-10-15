import { Platform, StyleSheet, View, type NativeSyntheticEvent } from "react-native"
import SegmentedControl, {
  type FontStyle,
  type NativeSegmentedControlIOSChangeEvent,
} from "@react-native-segmented-control/segmented-control"
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect"

import { colors, fonts, layout, radii } from "../../theme"

const trackBlurEnabled =
  Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

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

const segmentFont: FontStyle = {
  color: colors.mutedForeground,
  fontFamily: fonts.sansMedium,
  fontSize: 15,
}

const selectedSegmentFont: FontStyle = {
  color: colors.brandForeground,
  fontFamily: fonts.sansMedium,
  fontSize: 15,
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

  const control = (
    <SegmentedControl
      activeFontStyle={selectedSegmentFont}
      appearance="dark"
      {...(trackBlurEnabled ? { backgroundColor: colors.transparent } : null)}
      fontStyle={segmentFont}
      onChange={handleChange}
      selectedIndex={selectedIndex}
      style={styles.control}
      tintColor={colors.brand}
      values={options.map((option) => option.label)}
    />
  )

  return (
    <View style={[styles.shift, { width }]}>
      {trackBlurEnabled ? (
        <GlassView colorScheme="dark" glassEffectStyle="regular" style={styles.track}>
          {control}
        </GlassView>
      ) : (
        control
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  shift: {
    marginTop: layout.segmentedOffset,
  },
  track: {
    borderRadius: radii.pill,
    height: layout.tabBarPill,
    overflow: "hidden",
    width: "100%",
  },
  control: {
    height: layout.tabBarPill,
    width: "100%",
  },
})
