import { Pressable, StyleSheet, Text, View } from "react-native"

import { colors, fonts, radii } from "../../../theme"

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
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {option.label}
            </Text>
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
  chipText: {
    color: colors.mutedForeground,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 16,
  },
  chipTextSelected: {
    color: colors.brandForeground,
  },
})
