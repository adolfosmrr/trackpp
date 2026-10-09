import { Pressable, StyleSheet, Text, View } from "react-native"

import { CreateFixedExpenseIcon } from "../../../components/icons/CreateFixedExpenseIcon"
import { ViewFixedExpensesIcon } from "../../../components/icons/ViewFixedExpensesIcon"
import { colors, fonts, radii } from "../../../theme"

type FixedExpenseActionsProps = {
  onCreatePress: () => void
  onViewPress: () => void
}

export function FixedExpenseActions({
  onCreatePress,
  onViewPress,
}: FixedExpenseActionsProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.actionSurface, styles.brandSurface]}>
        <Pressable
          onPress={onCreatePress}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <CreateFixedExpenseIcon />
          <Text style={styles.darkText}>Crear{"\n"}Gasto Fijo</Text>
        </Pressable>
      </View>

      <View style={[styles.actionSurface, styles.darkSurface]}>
        <Pressable
          onPress={onViewPress}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <ViewFixedExpensesIcon />
          <Text style={styles.lightText}>Ver{"\n"}Gastos Fijos</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  actionSurface: {
    flex: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    minWidth: 0,
  },
  button: {
    alignItems: "flex-start",
    borderRadius: radii.md,
    flexDirection: "column",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: "100%",
  },
  brandSurface: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  darkSurface: {
    backgroundColor: colors.card,
  },
  darkText: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "left",
  },
  lightText: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "left",
  },
  pressed: {
    opacity: 0.85,
  },
})
