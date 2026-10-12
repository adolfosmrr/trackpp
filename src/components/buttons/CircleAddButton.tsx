import { Pressable, StyleSheet, Text } from "react-native"

import { colors, fonts, radii } from "../../theme"

type CircleAddButtonProps = {
  accessibilityLabel: string
  onPress: () => void
}

export function CircleAddButton({ accessibilityLabel, onPress }: CircleAddButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={2}
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.label}>+</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  label: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 24,
    lineHeight: 28,
  },
})
