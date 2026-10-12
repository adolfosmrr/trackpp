import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"

import { GlassButton } from "../buttons/GlassButton"
import { colors, fonts } from "../../theme"

type SectionHeaderProps = {
  title: string
  icon?: ReactNode
  actionLabel?: string
  actionAccessibilityLabel?: string
  onAction?: () => void
  trailing?: ReactNode
}

export function SectionHeader({
  title,
  icon,
  actionLabel,
  actionAccessibilityLabel,
  onAction,
  trailing,
}: SectionHeaderProps) {
  const action =
    actionLabel && onAction ? (
      <GlassButton
        accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
        fallbackStyle={styles.actionFallback}
        glassStyle={styles.actionGlass}
        label={actionLabel}
        labelStyle={styles.actionLabel}
        onPress={onAction}
        style={styles.actionPressable}
      />
    ) : (
      trailing
    )

  return (
    <View style={styles.row}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {action ? <View style={styles.trailing}>{action}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  icon: {
    flexShrink: 0,
  },
  title: {
    color: colors.foreground,
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: fonts.sansSemibold,
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 26,
    minWidth: 0,
  },
  trailing: {
    flexShrink: 0,
  },
  actionGlass: {
    flexShrink: 0,
  },
  actionFallback: {
    alignItems: "center",
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  actionPressable: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  actionLabel: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 14,
  },
})
