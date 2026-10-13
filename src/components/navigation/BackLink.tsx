import { StyleSheet, View } from "react-native"

import { GlassButton } from "../buttons/GlassButton"

type BackLinkProps = {
  onPress: () => void
}

export function BackLink({ onPress }: BackLinkProps) {
  return (
    <View style={styles.wrap}>
      <GlassButton
        accessibilityLabel="Volver"
        label="Volver"
        onPress={onPress}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
  },
})
