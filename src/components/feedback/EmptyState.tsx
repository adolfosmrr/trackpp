import { Pressable, StyleSheet, Text, View } from "react-native"

import { colors, fonts, radii } from "../../theme"

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
      <Pressable accessibilityRole="button" onPress={onAction} style={styles.button}>
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </Pressable>
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
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.sm,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 18,
  },
  buttonText: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
  },
})
