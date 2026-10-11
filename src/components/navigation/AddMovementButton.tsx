import { Pressable, StyleSheet, Text } from "react-native"

import { useCreateTransactionSheet } from "../../features/transactions/components/CreateTransactionSheetProvider"
import { colors, fonts, radii } from "../../theme"

export function AddMovementButton() {
  const { openCreateTransaction } = useCreateTransactionSheet()

  return (
    <Pressable
      accessibilityLabel="Agregar movimiento"
      accessibilityRole="button"
      hitSlop={{ top: 2, bottom: 2 }}
      onPress={() => {
        void openCreateTransaction()
      }}
      style={styles.button}
    >
      <Text style={styles.label}>+ Movimiento</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    flexShrink: 0,
    height: 40,
    justifyContent: "center",
    minWidth: 44,
    paddingHorizontal: 14,
  },
  label: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
  },
})
