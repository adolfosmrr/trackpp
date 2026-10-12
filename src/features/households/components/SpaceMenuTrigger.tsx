import {
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
} from "react-native"

import { ChevronDownIcon } from "../../../components/icons/ChevronDownIcon"
import { colors, fonts, radii } from "../../../theme"
import { SPACE_MENU_LABEL } from "./spaceMenu"

type SpaceMenuTriggerProps = {
  compact: boolean
  label: string
  accessible?: boolean
  accessibilityActions?: AccessibilityActionInfo[]
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void
}

export function SpaceMenuTrigger({
  compact,
  label,
  accessible = true,
  accessibilityActions,
  onAccessibilityAction,
}: SpaceMenuTriggerProps) {
  return (
    <View
      accessibilityActions={accessibilityActions}
      accessibilityLabel={accessible ? SPACE_MENU_LABEL : undefined}
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
    height: 40,
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
