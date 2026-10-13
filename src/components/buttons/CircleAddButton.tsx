import { StyleSheet, Text } from "react-native"
import { requireOptionalNativeModule } from "expo"

import { colors, fonts, layout } from "../../theme"
import { GlassButton } from "./GlassButton"

// SymbolView's iOS entry loads SymbolModule immediately. Skip that require
// until a dev build actually contains the native module.
const symbolModule = requireOptionalNativeModule("SymbolModule")
const SymbolView = symbolModule
  ? (require("expo-symbols") as typeof import("expo-symbols")).SymbolView
  : null

type CircleAddButtonProps = {
  accessibilityLabel: string
  onPress: () => void
}

export function CircleAddButton({ accessibilityLabel, onPress }: CircleAddButtonProps) {
  return (
    <GlassButton
      accessibilityLabel={accessibilityLabel}
      fallbackStyle={styles.fallback}
      glassStyle={styles.circle}
      hitSlop={2}
      icon={(color) =>
        SymbolView ? (
          <SymbolView
            name={{ ios: "plus", android: "add", web: "add" }}
            size={18}
            tintColor={color}
            weight="semibold"
          />
        ) : (
          <Text style={[styles.fallbackGlyph, { color }]}>+</Text>
        )
      }
      onPress={onPress}
      style={styles.circle}
    />
  )
}

const styles = StyleSheet.create({
  circle: {
    height: layout.headerPill,
    paddingHorizontal: 0,
    width: layout.headerPill,
  },
  fallback: {
    alignItems: "center",
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    height: layout.headerPill,
    justifyContent: "center",
    paddingHorizontal: 0,
    width: layout.headerPill,
  },
  fallbackGlyph: {
    fontFamily: fonts.sansSemibold,
    fontSize: 22,
    lineHeight: 22,
  },
})
