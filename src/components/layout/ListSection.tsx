import type { ReactNode } from "react"
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"

import { layout } from "../../theme"

type ListSectionProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

/** Applies the single horizontal inset shared by every list section. */
export function ListSection({ children, style }: ListSectionProps) {
  return <View style={[styles.section, style]}>{children}</View>
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: layout.sectionInset,
  },
})
