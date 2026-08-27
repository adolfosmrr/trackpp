import { Pressable, StyleSheet, Text, View } from "react-native"

import { GoogleIcon } from "../../../components/icons/GoogleIcon"
import { MatrixTextMorph } from "../../../components/text/MatrixTextMorph"

type GoogleAuthButtonProps = {
  label: string
  loading: boolean
  onPress: () => void
}

export function GoogleAuthButton({
  label,
  loading,
  onPress,
}: GoogleAuthButtonProps) {
  return (
    <Pressable
      style={[styles.button, loading && styles.disabled]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <Text style={styles.text}>Conectando...</Text>
      ) : (
        <MatrixTextMorph text={label} style={styles.text} stepDuration={15} />
      )}
      <View style={styles.iconContainer}>
        <GoogleIcon />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 9999,
    borderWidth: 0,
    backgroundColor: "#EAEAEA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabled: { opacity: 0.6 },
  text: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 16,
  },
  iconContainer: {
    width: 22,
    height: 22,
    flexShrink: 0,
  },
})
