import { StyleSheet, View } from "react-native"

import { GlassButton } from "../buttons/GlassButton"
import { AppText } from "../text/AppText"
import { colors } from "../../theme"

type EmptyStateProps = {
  title: string
  body: string
  actionLabel: string
  onAction: () => void
}

export function EmptyState({ title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <AppText style={styles.center} variant="subtitle">{title}</AppText>
      <AppText style={styles.center} tone="muted" variant="body">{body}</AppText>
      <GlassButton
        accessibilityLabel={actionLabel}
        fallbackStyle={styles.actionFallback}
        label={actionLabel}
        onPress={onAction}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 28,
  },
  center: {
    textAlign: "center",
  },
  actionFallback: {
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    marginTop: 8,
  },
})
