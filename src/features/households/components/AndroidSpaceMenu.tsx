import { useRef, useState } from "react"
import { Pressable, View } from "react-native"
import {
  DropdownMenu,
  DropdownMenuItem,
  HorizontalDivider,
  Host,
  RNHostView,
  Text,
} from "@expo/ui/jetpack-compose"

import { SpaceMenuTrigger } from "./SpaceMenuTrigger"
import { CREATE_SPACE_LABEL, SPACE_MENU_LABEL, type SpaceMenuProps } from "./spaceMenu"

export function SpaceMenu({ compact, label, items, onSelect, onCreate }: SpaceMenuProps) {
  const [expanded, setExpanded] = useState(false)
  const expandedRef = useRef(false)

  function open() {
    if (expandedRef.current) return
    expandedRef.current = true
    setExpanded(true)
  }

  function dismiss() {
    if (!expandedRef.current) return
    expandedRef.current = false
    setExpanded(false)
  }

  return (
    <View style={compact ? { flexShrink: 1 } : undefined}>
      <Host colorScheme="dark" matchContents>
        <DropdownMenu expanded={expanded} onDismissRequest={dismiss}>
          <DropdownMenu.Trigger>
            <RNHostView matchContents>
              <Pressable
                accessibilityLabel={SPACE_MENU_LABEL}
                accessibilityRole="button"
                android_disableSound
                onPress={open}
              >
                <SpaceMenuTrigger accessible={false} compact={compact} label={label} />
              </Pressable>
            </RNHostView>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => {
                  onSelect(item.id)
                  dismiss()
                }}
              >
                <DropdownMenuItem.Text>
                  <Text>{`${item.name}\n${item.subtitle}`}</Text>
                </DropdownMenuItem.Text>
                {item.selected ? (
                  <DropdownMenuItem.TrailingIcon>
                    <Text>✓</Text>
                  </DropdownMenuItem.TrailingIcon>
                ) : null}
              </DropdownMenuItem>
            ))}
            {items.length > 0 ? <HorizontalDivider /> : null}
            <DropdownMenuItem
              onClick={() => {
                dismiss()
                onCreate()
              }}
            >
              <DropdownMenuItem.Text>
                <Text>{CREATE_SPACE_LABEL}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          </DropdownMenu.Items>
        </DropdownMenu>
      </Host>
    </View>
  )
}
