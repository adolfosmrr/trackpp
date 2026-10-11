import type { ReactNode } from "react"
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native"
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect"

import { colors } from "../../theme"

const liquidGlassEnabled = isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

type GlassButtonTone = "neutral" | "brand"

type GlassButtonProps = {
  accessibilityLabel: string
  children?: ReactNode
  /** When set, the button renders this label and picks its color from `tone`. */
  label?: string
  labelStyle?: StyleProp<TextStyle>
  icon?: (color: string) => ReactNode
  /**
   * `brand` uses brand foreground on the solid fallback and foreground on clear glass.
   * `neutral` leaves child colors alone.
   */
  tone?: GlassButtonTone
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
  label,
  labelStyle,
  icon,
  tone = "neutral",
  onPress,
  glassStyle,
  style,
  fallbackStyle,
  hitSlop,
}: GlassButtonProps) {
  const color = tone === "brand" && liquidGlassEnabled ? colors.foreground : colors.brandForeground
  const content = (
    <>
      {label ? (
        <Text style={[labelStyle, tone === "brand" ? { color } : null]}>{label}</Text>
      ) : null}
      {icon ? icon(tone === "brand" ? color : colors.foreground) : null}
      {children}
    </>
  )

  if (!liquidGlassEnabled) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={hitSlop}
        onPress={onPress}
        style={fallbackStyle}
      >
        {content}
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
        {content}
      </Pressable>
    </GlassView>
  )
}

const styles = StyleSheet.create({
  pressable: {
    backgroundColor: "transparent",
  },
})
