import type { NativeSyntheticEvent } from "react-native"
import SegmentedControl, {
  type FontStyle,
  type NativeSegmentedControlIOSChangeEvent,
} from "@react-native-segmented-control/segmented-control"

import { colors, fonts } from "../../theme"

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

  return (
    <SegmentedControl
      activeFontStyle={selectedSegmentFont}
      appearance="dark"
      backgroundColor={colors.control}
      fontStyle={segmentFont}
      onChange={handleChange}
      selectedIndex={selectedIndex}
      style={width !== undefined ? { width } : undefined}
      tintColor={colors.brand}
      values={options.map((option) => option.label)}
    />
  )
}
