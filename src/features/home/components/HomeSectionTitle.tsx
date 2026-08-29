import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"

type HomeSectionTitleProps = {
  title: string
  icon: ReactNode
  rightElement?: ReactNode
}

export function HomeSectionTitle({ title, icon, rightElement }: HomeSectionTitleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leading}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </View>
      {rightElement}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  leading: {
    alignItems: "center",
    columnGap: 10,
    flexDirection: "row",
  },
  title: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 20,
    lineHeight: 20,
  },
})
