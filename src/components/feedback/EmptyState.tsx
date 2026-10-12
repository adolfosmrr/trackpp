import { StyleSheet, Text, View } from "react-native"

import { colors, fonts } from "../../theme"
import { Button } from "../buttons/Button"

type EmptyStateProps = {
  title: string
  body: string
  actionLabel: string
  onAction: () => void
}

export function EmptyState({ title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Button label={actionLabel} onPress={onAction} style={styles.button} tone="brand" />
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
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  body: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
  },
})
