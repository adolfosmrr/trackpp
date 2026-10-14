import { requireOptionalNativeModule } from "expo"
import { StyleSheet, Text } from "react-native"
import type { SymbolViewProps } from "expo-symbols"

import { fonts } from "../../theme"

// SymbolView's iOS entry loads SymbolModule immediately. Skip that require
// until a dev build actually contains the native module.
const symbolModule = requireOptionalNativeModule("SymbolModule")
const SymbolView = symbolModule
  ? (require("expo-symbols") as typeof import("expo-symbols")).SymbolView
  : null

type SymbolIconProps = {
  color: string
  fallback: string
  name: SymbolViewProps["name"]
  size?: number
}

export function SymbolIcon({ color, fallback, name, size = 16 }: SymbolIconProps) {
  if (!SymbolView) {
    return (
      <Text style={[styles.fallback, { color, fontSize: size, lineHeight: size }]}>
        {fallback}
      </Text>
    )
  }

  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight="semibold"
    />
  )
}

const styles = StyleSheet.create({
  fallback: {
    fontFamily: fonts.sansSemibold,
    textAlign: "center",
  },
})
