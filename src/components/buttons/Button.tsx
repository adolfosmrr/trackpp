import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native"

import { colors, fonts, radii } from "../../theme"

type ButtonTone = "brand" | "outline" | "destructive" | "ghost"

type ButtonProps = {
  accessibilityLabel?: string
  disabled?: boolean
  hitSlop?: PressableProps["hitSlop"]
  label: string
  labelStyle?: StyleProp<TextStyle>
  onPress: () => void
  size?: "regular" | "compact"
  style?: StyleProp<ViewStyle>
  tone?: ButtonTone
}

export function Button({
  accessibilityLabel,
  disabled = false,
  hitSlop,
  label,
  labelStyle,
  onPress,
  size = "regular",
  style,
  tone = "brand",
}: ButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={[
        styles.base,
        size === "compact" ? styles.compact : null,
        toneStyles[tone],
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.label, toneLabel[tone], labelStyle]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 18,
  },
  compact: {
    height: 40,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
    lineHeight: 20,
  },
})

const toneStyles = StyleSheet.create({
  brand: {
    backgroundColor: colors.brand,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  destructive: {
    backgroundColor: colors.transparent,
    borderColor: colors.border,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
})

const toneLabel = StyleSheet.create({
  brand: {
    color: colors.brandForeground,
  },
  outline: {
    color: colors.foreground,
  },
  destructive: {
    color: colors.destructive,
  },
  ghost: {
    color: colors.mutedForeground,
  },
})
