import { useEffect, useRef } from "react"
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
  /** True once the sheet content has moved under the title. */
  scrolled: boolean
}

export function SheetHeader({
  title,
  onClose,
  closeAccessibilityLabel = "Cerrar",
  scrolled,
}: SheetHeaderProps) {
  const scrimOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (liquidGlassEnabled) return
    Animated.timing(scrimOpacity, {
      toValue: scrolled ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [scrolled, scrimOpacity])

  return (
    <View collapsable={false} pointerEvents="box-none" style={styles.header}>
      {liquidGlassEnabled ? (
        <GlassView
          colorScheme="dark"
          glassEffectStyle={{
            style: scrolled ? "regular" : "none",
            animate: true,
            animationDuration: 0.18,
          }}
          pointerEvents="none"
          style={styles.glass}
        />
      ) : (
        <Animated.View pointerEvents="none" style={[styles.fallbackScrim, { opacity: scrimOpacity }]} />
      )}
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
  glass: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
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
