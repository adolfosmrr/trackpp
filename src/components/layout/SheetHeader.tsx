import { StyleSheet, Text, View } from "react-native"

import { GlassButton } from "../buttons/GlassButton"
import { CloseIcon } from "../icons/CloseIcon"
import { colors, fonts, layout } from "../../theme"

/**
 * Space below the sheet's top edge so the title and close button sit clear of
 * the system grabber. Form sheets hide the navigation header, and on iOS 26
 * that also drops the top safe-area edge, so the grabber draws over the content.
 */
const GRABBER_CLEARANCE = 28

type SheetHeaderProps = {
  title: string
  onClose: () => void
  closeAccessibilityLabel?: string
}

export function SheetHeader({
  title,
  onClose,
  closeAccessibilityLabel = "Cerrar",
}: SheetHeaderProps) {
  return (
    <View collapsable={false} style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <GlassButton
        accessibilityLabel={closeAccessibilityLabel}
        fallbackStyle={styles.closeFallback}
        glassStyle={styles.closeButton}
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
    paddingBottom: 12,
    paddingHorizontal: layout.sectionInset,
    paddingTop: GRABBER_CLEARANCE,
  },
  title: {
    color: colors.foreground,
    flexShrink: 1,
    fontFamily: fonts.sansSemibold,
    fontSize: 20,
    lineHeight: 24,
  },
  closeButton: {
    alignItems: "center",
    flexShrink: 0,
    height: layout.headerPill,
    justifyContent: "center",
    width: layout.headerPill,
  },
  closeFallback: {
    alignItems: "center",
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    height: layout.headerPill,
    justifyContent: "center",
    width: layout.headerPill,
  },
})
