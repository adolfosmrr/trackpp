import { Pressable, StyleSheet, Text } from "react-native"

import { colors, fonts, radii } from "../../../theme"

type HomeSectionToggleProps = {
  expanded: boolean
  onPress: () => void
}

export function HomeSectionToggle({ expanded, onPress }: HomeSectionToggleProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{expanded ? "Cerrar" : "Ver más"}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 28,
    paddingHorizontal: 10,
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 14,
  },
})
