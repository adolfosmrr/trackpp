import { Pressable, StyleSheet, Text } from "react-native"

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
    paddingHorizontal: 20,
    backgroundColor: "#000000",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 12,
    lineHeight: 12,
  },
})
