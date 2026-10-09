import { Pressable, StyleSheet, Text } from "react-native"

import { colors, fonts } from "../../theme"

type BackLinkProps = {
  onPress: () => void
}

export function BackLink({ onPress }: BackLinkProps) {
  return (
    <Pressable
      accessibilityLabel="Volver"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={styles.hit}
    >
      <Text style={styles.back}>Volver</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: "flex-start",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    paddingRight: 12,
  },
  back: {
    color: colors.brand,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
  },
})
