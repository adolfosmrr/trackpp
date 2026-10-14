import { MenuTrigger } from "./MenuTrigger"
import type { NativeMenuProps } from "./nativeMenu"

export function NativeMenu({
  accessibilityLabel,
  compact = false,
  entries,
  label,
  onSelect,
  variant,
}: NativeMenuProps) {
  return (
    <MenuTrigger
      accessibilityActions={entries.map((entry) => ({
        name: entry.id,
        label: entry.subtitle ? `${entry.title}, ${entry.subtitle}` : entry.title,
      }))}
      accessibilityLabel={accessibilityLabel}
      compact={compact}
      label={label}
      onAccessibilityAction={(event) => onSelect(event.nativeEvent.actionName)}
      variant={variant}
    />
  )
}
