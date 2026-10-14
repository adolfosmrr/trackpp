import {
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
} from "react-native"

import { ChevronDownIcon } from "../icons/ChevronDownIcon"
import { FieldChevronIcon } from "../icons/FieldChevronIcon"
import { fieldStyles } from "../inputs/TextField"
import { colors, fonts, layout, radii } from "../../theme"

type MenuTriggerProps = {
  accessibilityLabel: string
  label: string
  variant: "space" | "field"
  compact?: boolean
  accessible?: boolean
  accessibilityActions?: AccessibilityActionInfo[]
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void
}

export function MenuTrigger({
  accessibilityLabel,
  label,
  variant,
  compact = false,
  accessible = true,
  accessibilityActions,
  onAccessibilityAction,
}: MenuTriggerProps) {
  if (variant === "field") {
    return (
      <View
        accessibilityActions={accessibilityActions}
        accessibilityLabel={accessible ? accessibilityLabel : undefined}
        accessibilityRole={accessible ? "button" : undefined}
        accessible={accessible}
        onAccessibilityAction={onAccessibilityAction}
        style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}
      >
        <Text numberOfLines={1} style={styles.fieldLabel}>{label}</Text>
        <FieldChevronIcon />
      </View>
    )
  }

  return (
    <View
      accessibilityActions={accessibilityActions}
      accessibilityLabel={accessible ? accessibilityLabel : undefined}
      accessibilityRole={accessible ? "button" : undefined}
      accessible={accessible}
      onAccessibilityAction={onAccessibilityAction}
      style={[styles.trigger, compact && styles.compact]}
    >
      <Text numberOfLines={1} style={[styles.label, compact && styles.compactLabel]}>
        {label}
      </Text>
      {compact ? <ChevronDownIcon /> : <Text style={styles.chevron}>▼</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  fieldLabel: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  trigger: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  compact: {
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexShrink: 1,
    gap: 8,
    height: layout.headerPill,
    marginLeft: 15,
    paddingHorizontal: 20,
  },
  label: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    fontWeight: "600",
  },
  compactLabel: {
    fontSize: 16,
    fontWeight: undefined,
    lineHeight: 16,
  },
  chevron: {
    color: colors.mutedForeground,
    fontSize: 10,
  },
})
