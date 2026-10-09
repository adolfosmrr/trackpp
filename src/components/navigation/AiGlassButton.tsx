import { useEffect, useState } from "react"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fonts } from "../../theme"
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect"

type AiGlassButtonProps = {
  onPress: () => void
}

// iOS 26 renders the floating native tab bar at approximately 64pt tall.
// Keep the AI surface square so its visual height matches that reference.
export const AI_GLASS_BUTTON_SIZE = 64

export function AiGlassButton({ onPress }: AiGlassButtonProps) {
  const [glassAvailable, setGlassAvailable] = useState(false)

  useEffect(() => {
    if (Platform.OS !== "ios") {
      return
    }

    try {
      const apiAvailable = isGlassEffectAPIAvailable()
      const liquidGlassAvailable = isLiquidGlassAvailable()

      console.log("[AiGlassButton] glass availability", {
        apiAvailable,
        liquidGlassAvailable,
      })

      setGlassAvailable(apiAvailable && liquidGlassAvailable)
    } catch {
      setGlassAvailable(false)
    }
  }, [])

  return (
    glassAvailable ? (
      <GlassView
        style={styles.button}
        glassEffectStyle="clear"
        isInteractive
      >
        <Pressable
          style={styles.pressableContent}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Abrir asistente de IA"
        >
          <Text style={styles.label}>AI</Text>
        </Pressable>
      </GlassView>
    ) : (
      <View style={[styles.button, styles.fallbackSurface]}>
        <Pressable
          style={styles.pressableContent}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Abrir asistente de IA"
        >
          <Text style={styles.label}>AI</Text>
        </Pressable>
      </View>
    )
  )
}

const styles = StyleSheet.create({
  button: {
    width: AI_GLASS_BUTTON_SIZE,
    height: AI_GLASS_BUTTON_SIZE,
    borderRadius: AI_GLASS_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackSurface: {
    backgroundColor: colors.brand,
  },
  pressableContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
  },
})
