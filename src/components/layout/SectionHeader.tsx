import { StyleSheet, Text, View } from "react-native"

import { CircleAddButton } from "../buttons/CircleAddButton"
import { colors, fonts } from "../../theme"

type SectionHeaderProps = {
  title: string
  actionLabel?: string
  onAction?: () => void
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <CircleAddButton accessibilityLabel={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.sansSemibold,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.4,
    lineHeight: 26,
  },
})
