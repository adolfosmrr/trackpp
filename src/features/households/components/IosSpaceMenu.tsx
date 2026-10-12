import { Host, Menu, Text, Toggle, Divider, Button } from "@expo/ui/swift-ui"
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  menuIndicator,
  menuOrder,
  truncationMode,
} from "@expo/ui/swift-ui/modifiers"

import { fonts } from "../../../theme"
import {
  CREATE_SPACE_LABEL,
  SPACE_MENU_LABEL,
  type SpaceMenuProps,
} from "./spaceMenu"

export function SpaceMenu({ compact, label, items, onSelect, onCreate }: SpaceMenuProps) {
  return (
    <Host
      colorScheme="dark"
      ignoreSafeArea="all"
      matchContents
      style={compact ? { flexShrink: 1, marginLeft: 15 } : { flexShrink: 1 }}
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
          menuIndicator("visible"),
          menuOrder("fixed"),
          accessibilityLabel(SPACE_MENU_LABEL),
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
