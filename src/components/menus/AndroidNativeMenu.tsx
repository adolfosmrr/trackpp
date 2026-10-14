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
    <View style={variant === "field" ? styles.field : compact ? styles.compact : undefined}>
      <Host colorScheme="dark" matchContents>
        <DropdownMenu expanded={expanded} onDismissRequest={dismiss}>
          <DropdownMenu.Trigger>
            <RNHostView matchContents>
              <Pressable
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                android_disableSound
                onPress={open}
              >
                <MenuTrigger
                  accessibilityLabel={accessibilityLabel}
                  accessible={false}
                  compact={compact}
                  label={label}
                  variant={variant}
                />
              </Pressable>
            </RNHostView>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {entries.flatMap((entry) => {
              const item = (
                <DropdownMenuItem
                  key={entry.id}
                  onClick={() => {
                    dismiss()
                    onSelect(entry.id)
                  }}
                >
                  <DropdownMenuItem.Text>
                    <Text>
                      {entry.subtitle ? `${entry.title}\n${entry.subtitle}` : entry.title}
                    </Text>
                  </DropdownMenuItem.Text>
                  {entry.selected ? (
                    <DropdownMenuItem.TrailingIcon>
                      <Text>✓</Text>
                    </DropdownMenuItem.TrailingIcon>
                  ) : null}
                </DropdownMenuItem>
              )
              return entry.separatorBefore
                ? [<HorizontalDivider key={`${entry.id}-separator`} />, item]
                : [item]
            })}
          </DropdownMenu.Items>
        </DropdownMenu>
      </Host>
    </View>
  )
}

const styles = {
  field: {
    width: "100%" as const,
  },
  compact: {
    flexShrink: 1,
  },
}
