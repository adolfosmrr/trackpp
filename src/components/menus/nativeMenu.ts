export type NativeMenuEntry = {
  id: string
  title: string
  subtitle?: string
  selected?: boolean
  destructive?: boolean
  separatorBefore?: boolean
}

export type NativeMenuProps = {
  accessibilityLabel: string
  label: string
  entries: readonly NativeMenuEntry[]
  onSelect: (id: string) => void
  variant: "space" | "field"
  compact?: boolean
}
