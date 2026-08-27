import { Pressable, StyleSheet } from "react-native"

type TopSectionHandleProps = {
  onPress?: () => void
}

export function TopSectionHandle({ onPress }: TopSectionHandleProps) {
  return (
    <Pressable
      accessibilityLabel="Control del panel superior"
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={[styles.container, styles.handle]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginBottom: 10,
  },
  handle: {
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    height: 5,
    width: 20,
  },
})
