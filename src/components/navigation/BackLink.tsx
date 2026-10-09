import { Pressable, StyleSheet, Text } from "react-native"

import { colors, fonts } from "../../theme"

type BackLinkProps = {
  onPress: () => void
}

export function BackLink({ onPress }: BackLinkProps) {
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
      <Text style={styles.back}>Volver</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  back: {
    color: colors.brand,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
  },
})
