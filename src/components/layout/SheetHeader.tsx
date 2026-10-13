import { Animated, StyleSheet, View } from "react-native"
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect"

import { GlassButton } from "../buttons/GlassButton"
import { CloseIcon } from "../icons/CloseIcon"
import { AppText } from "../text/AppText"
import { colors, layout } from "../../theme"

const liquidGlassEnabled = isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

type SheetHeaderProps = {
  title: string
  onClose: () => void
  closeAccessibilityLabel?: string
  scrollY: Animated.Value
}

export function SheetHeader({
  title,
  onClose,
  closeAccessibilityLabel = "Cerrar",
  scrollY,
}: SheetHeaderProps) {
  const glassOpacity = scrollY.interpolate({
    inputRange: [0, 12],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })

  return (
    <View collapsable={false} pointerEvents="box-none" style={styles.header}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: glassOpacity }]}>
        {liquidGlassEnabled ? (
          <GlassView
            colorScheme="dark"
            glassEffectStyle="regular"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.fallbackScrim} />
        )}
      </Animated.View>
      <AppText style={styles.title} variant="title">{title}</AppText>
      <GlassButton
        accessibilityLabel={closeAccessibilityLabel}
        fallbackStyle={styles.closeFallback}
        glassStyle={styles.closeButton}
        hitSlop={2}
        icon={(color) => <CloseIcon color={color} />}
        onPress={onClose}
        style={styles.closeButton}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    left: 0,
    paddingBottom: layout.titleContentGap,
    paddingHorizontal: layout.sheetPadding,
    paddingTop: layout.sheetHeaderTop,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 2,
  },
  title: {
    flexShrink: 1,
  },
  fallbackScrim: {
    backgroundColor: colors.background,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: "center",
    flexShrink: 0,
    height: layout.headerPill,
    justifyContent: "center",
    paddingHorizontal: 0,
    width: layout.headerPill,
  },
  closeFallback: {
    alignItems: "center",
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    height: layout.headerPill,
    justifyContent: "center",
    paddingHorizontal: 0,
    width: layout.headerPill,
  },
})
