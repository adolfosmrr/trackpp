import { Host, Menu, Text, Toggle, Divider, Button } from "@expo/ui/swift-ui"
import {
  accessibilityLabel,
  background,
  buttonBorderShape,
  buttonStyle,
  clipShape,
  controlSize,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  menuIndicator,
  menuOrder,
  padding,
  shapes,
  truncationMode,
} from "@expo/ui/swift-ui/modifiers"

import { colors, fonts, layout } from "../../theme"
import type { NativeMenuEntry, NativeMenuProps } from "./nativeMenu"

const compactCapsule = [
  frame({ height: layout.headerPill }),
  clipShape("capsule"),
]

export function NativeMenu({
  accessibilityLabel: labelForAccessibility,
  compact = false,
  entries,
  label,
  onSelect,
  variant,
}: NativeMenuProps) {
  const items = entries.flatMap((entry) => {
    const control = (
      <MenuEntry key={entry.id} entry={entry} onSelect={onSelect} />
    )
    return entry.separatorBefore
      ? [<Divider key={`${entry.id}-separator`} />, control]
      : [control]
  })

  if (variant === "field") {
    return (
      <Host
        colorScheme="dark"
        ignoreSafeArea="all"
        matchContents={{ vertical: true }}
        style={styles.fieldHost}
      >
        <Menu
          label={
            <Text
              modifiers={[
                font({ family: fonts.sans, size: 16 }),
                lineLimit(1),
                truncationMode("tail"),
                frame({ maxWidth: 10000, alignment: "leading" }),
              ]}
            >
              {label}
            </Text>
          }
          modifiers={[
            buttonStyle("plain"),
            menuIndicator("visible"),
            menuOrder("fixed"),
            background(colors.field, shapes.capsule()),
            frame({ maxWidth: 10000, alignment: "leading" }),
            padding({ horizontal: 20, vertical: 15 }),
            accessibilityLabel(labelForAccessibility),
          ]}
        >
          {items}
        </Menu>
      </Host>
    )
  }

  return (
    <Host
      colorScheme="dark"
      ignoreSafeArea="all"
      matchContents={compact ? { horizontal: true } : true}
      modifiers={compact ? compactCapsule : undefined}
      style={
        compact
          ? {
              flexShrink: 1,
              height: layout.headerPill,
              marginLeft: 15,
              overflow: "hidden",
            }
          : { flexShrink: 1 }
      }
    >
      <Menu
        label={
          <Text
            modifiers={[
              font({ family: fonts.sansMedium, size: 16 }),
              lineLimit(1),
              truncationMode("tail"),
              frame({ maxWidth: 220, alignment: "leading" }),
              ...(compact
                ? [frame({ height: layout.headerPill, alignment: "center" })]
                : []),
            ]}
          >
            {label}
          </Text>
        }
        modifiers={[
          buttonStyle("glass"),
          buttonBorderShape("capsule"),
          controlSize(compact ? "extraLarge" : "regular"),
          padding({ vertical: 0 }),
          menuIndicator("visible"),
          menuOrder("fixed"),
          accessibilityLabel(labelForAccessibility),
          ...(compact ? compactCapsule : []),
        ]}
      >
        {items}
      </Menu>
    </Host>
  )
}

function MenuEntry({
  entry,
  onSelect,
}: {
  entry: NativeMenuEntry
  onSelect: (id: string) => void
}) {
  if (entry.selected === undefined) {
    return (
      <Button
        label={entry.subtitle ? `${entry.title}, ${entry.subtitle}` : entry.title}
        onPress={() => onSelect(entry.id)}
        role={entry.destructive ? "destructive" : "default"}
      />
    )
  }

  return (
    <Toggle
      isOn={entry.selected}
      modifiers={[
        accessibilityLabel(
          entry.subtitle ? `${entry.title}, ${entry.subtitle}` : entry.title,
        ),
      ]}
      onIsOnChange={(isOn) => {
        if (isOn) onSelect(entry.id)
      }}
    >
      <Text>{entry.title}</Text>
      {entry.subtitle ? (
        <Text
          modifiers={[
            font({ textStyle: "caption" }),
            foregroundStyle({ type: "hierarchical", style: "secondary" }),
          ]}
        >
          {entry.subtitle}
        </Text>
      ) : null}
    </Toggle>
  )
}

const styles = {
  fieldHost: {
    width: "100%" as const,
  },
}
