import { useSyncExternalStore } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { AppText } from "../text/AppText"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { colors, radii } from "../../theme"
import { getUndoEntry, runUndoAction, subscribeUndo } from "./undo"

export function UndoSnackbar() {
  const insets = useSafeAreaInsets()
  const entry = useSyncExternalStore(subscribeUndo, getUndoEntry, getUndoEntry)

  if (!entry) return null

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View style={[styles.bar, { bottom: insets.bottom + 88 }]}>
        <AppText style={styles.message} variant="body">{entry.message}</AppText>
        {entry.actionLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={entry.actionLabel}
            onPress={runUndoAction}
            style={styles.action}
          >
            <AppText tone="brand" variant="subtitle">{entry.actionLabel}</AppText>
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
    flex: 1,
  },
  action: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
  },
})
