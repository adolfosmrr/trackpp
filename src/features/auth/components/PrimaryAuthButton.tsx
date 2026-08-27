import { Pressable, StyleSheet, Text } from "react-native"

import { MatrixTextMorph } from "../../../components/text/MatrixTextMorph"

type PrimaryAuthButtonProps = {
  label: string
  loading: boolean
  loadingLabel: string
  disabled?: boolean
  onPress: () => void
}

export function PrimaryAuthButton({
  label,
  loading,
  loadingLabel,
  disabled = false,
  onPress,
}: PrimaryAuthButtonProps) {
  return (
    <Pressable
      style={[styles.button, (loading || disabled) && styles.disabled]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <Text style={styles.buttonText}>{loadingLabel}</Text>
      ) : (
        <MatrixTextMorph
          text={label}
          stepDuration={30}
          style={styles.buttonText}
        />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 50,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "FamiljenGrotesk-Medium",
  },
})
