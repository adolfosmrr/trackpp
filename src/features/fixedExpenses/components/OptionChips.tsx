import { Pressable, StyleSheet, View } from "react-native"

import { AppText } from "../../../components/text/AppText"
import { colors, radii } from "../../../theme"

type OptionChip<T extends string> = {
  value: T
  label: string
}

type OptionChipsProps<T extends string> = {
  accessibilityLabel: string
  options: readonly OptionChip<T>[]
  value: T | null
  onChange: (value: T) => void
}

export function OptionChips<T extends string>({
  accessibilityLabel,
  options,
  value,
  onChange,
}: OptionChipsProps<T>) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={styles.row}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <AppText tone={selected ? "onBrand" : "muted"} variant="caption">
              {option.label}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    alignItems: "center",
    backgroundColor: colors.control,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: colors.brand,
  },
})
