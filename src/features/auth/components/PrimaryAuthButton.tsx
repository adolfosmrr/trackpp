import { Pressable, StyleSheet, Text } from "react-native"
import { colors, fonts, radii } from "../../../theme"

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
    padding: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.brand,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.brandForeground,
    fontWeight: "600",
    fontSize: 15,
    fontFamily: fonts.sansSemibold,
  },
})
