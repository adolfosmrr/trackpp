import { Host, Menu, Text, Toggle, Divider, Button } from "@expo/ui/swift-ui"
import {
  accessibilityLabel,
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
  truncationMode,
} from "@expo/ui/swift-ui/modifiers"

import { fonts, layout } from "../../../theme"
import {
  CREATE_SPACE_LABEL,
  SPACE_MENU_LABEL,
  type SpaceMenuProps,
} from "./spaceMenu"

const compactCapsule = [
  // `frame(height:)` proposes 40 but does not clip, and @expo/ui drops
  // min/max height when `height` is set. `clipShape` masks the regular
  // glass ideal size, which draws outside that frame, down to 40pt.
  frame({ height: layout.headerPill }),
  clipShape("capsule"),
]

export function SpaceMenu({ compact, label, items, onSelect, onCreate }: SpaceMenuProps) {
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
            ]}
          >
            {label}
          </Text>
        }
        modifiers={[
          buttonStyle("glass"),
          buttonBorderShape("capsule"),
          // Regular is the default. Smaller sizes do not stretch up to the frame.
          controlSize("regular"),
          padding({ vertical: 0 }),
          menuIndicator("visible"),
          menuOrder("fixed"),
          accessibilityLabel(SPACE_MENU_LABEL),
          ...(compact ? compactCapsule : []),
        ]}
      >
        {items.map((item) => (
          <Toggle
            key={item.id}
            isOn={item.selected}
            modifiers={[accessibilityLabel(`${item.name}, ${item.subtitle}`)]}
            onIsOnChange={(isOn) => {
              if (isOn) onSelect(item.id)
            }}
          >
            <Text>{item.name}</Text>
            <Text
              modifiers={[
                font({ textStyle: "caption" }),
                foregroundStyle({ type: "hierarchical", style: "secondary" }),
              ]}
            >
              {item.subtitle}
            </Text>
          </Toggle>
        ))}
        {items.length > 0 ? <Divider /> : null}
        <Button label={CREATE_SPACE_LABEL} onPress={onCreate} />
      </Menu>
    </Host>
  )
}
