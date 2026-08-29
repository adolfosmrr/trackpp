import { Pressable, StyleSheet, Text, View } from "react-native"
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg"

import { CreateFixedExpenseIcon } from "../../../components/icons/CreateFixedExpenseIcon"
import { ViewFixedExpensesIcon } from "../../../components/icons/ViewFixedExpensesIcon"

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
      <View style={styles.actionSurface}>
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient
              id="fixed-expense-actions-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0" stopColor="#BFFFC7" />
              <Stop offset="1" stopColor="#18A5A7" />
            </LinearGradient>
          </Defs>
          <Rect
            width="100%"
            height="100%"
            fill="url(#fixed-expense-actions-gradient)"
          />
        </Svg>
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
    borderRadius: 20,
    overflow: "hidden",
    minWidth: 0,
  },
  button: {
    alignItems: "flex-start",
    borderRadius: 20,
    flexDirection: "column",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: "100%",
  },
  darkSurface: {
    backgroundColor: "#000000",
  },
  darkText: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 20,
    lineHeight: 20,
    textAlign: "left",
  },
  lightText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 20,
    lineHeight: 20,
    textAlign: "left",
  },
  pressed: {
    opacity: 0.85,
  },
})
