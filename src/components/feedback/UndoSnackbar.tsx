import { useSyncExternalStore } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { colors, fonts, radii } from "../../theme"
import { getUndoEntry, runUndoAction, subscribeUndo } from "./undo"

export function UndoSnackbar() {
  const insets = useSafeAreaInsets()
  const entry = useSyncExternalStore(subscribeUndo, getUndoEntry, getUndoEntry)

  if (!entry) return null

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View style={[styles.bar, { bottom: insets.bottom + 88 }]}>
        <Text style={styles.message}>{entry.message}</Text>
        {entry.actionLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={entry.actionLabel}
            onPress={runUndoAction}
            style={styles.action}
          >
            <Text style={styles.actionText}>{entry.actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 80,
  },
  bar: {
    alignItems: "center",
    backgroundColor: colors.popover,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    left: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    right: 16,
  },
  message: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 20,
  },
  action: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
  },
  actionText: {
    color: colors.brand,
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
  },
})
