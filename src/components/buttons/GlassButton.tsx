import type { ReactNode } from "react"
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect"

export const liquidGlassEnabled = isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

type GlassButtonProps = {
  accessibilityLabel: string
  children: ReactNode
  onPress: () => void
  /** Frame around the clear glass. Used only when liquid glass is available. */
  glassStyle?: StyleProp<ViewStyle>
  /** Layout of the pressable inside the glass. */
  style?: StyleProp<ViewStyle>
  /** Full button style used when liquid glass is unavailable. */
  fallbackStyle?: StyleProp<ViewStyle>
  hitSlop?: PressableProps["hitSlop"]
}

export function GlassButton({
  accessibilityLabel,
  children,
  onPress,
  glassStyle,
  style,
  fallbackStyle,
  hitSlop,
}: GlassButtonProps) {
  if (!liquidGlassEnabled) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={hitSlop}
        onPress={onPress}
        style={fallbackStyle}
      >
        {children}
      </Pressable>
    )
  }

  return (
    <GlassView glassEffectStyle="clear" style={glassStyle}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={hitSlop}
        onPress={onPress}
        style={[styles.pressable, style]}
      >
        {children}
      </Pressable>
    </GlassView>
  )
}

const styles = StyleSheet.create({
  pressable: {
    backgroundColor: "transparent",
  },
})
