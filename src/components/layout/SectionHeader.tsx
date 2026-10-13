import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { GlassButton } from "../buttons/GlassButton"
import { AppText } from "../text/AppText"
import { colors } from "../../theme"

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
        onPress={onAction}
        style={styles.actionPressable}
      />
    ) : (
      trailing
    )

  return (
    <View style={styles.row}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <AppText style={styles.title} variant="title">{title}</AppText>
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
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  trailing: {
    flexShrink: 0,
  },
  actionGlass: {
    flexShrink: 0,
  },
  actionFallback: {
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    flexShrink: 0,
  },
  actionPressable: {
    flexShrink: 0,
  },
})
