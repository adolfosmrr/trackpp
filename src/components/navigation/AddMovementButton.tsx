import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useCreateTransactionSheet } from "../../features/transactions/components/CreateTransactionSheetProvider"
import { colors, fonts, radii } from "../../theme"

export function AddMovementButton() {
  const insets = useSafeAreaInsets()
  const { openCreateTransaction } = useCreateTransactionSheet()

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <Pressable
        accessibilityLabel="Agregar movimiento"
        accessibilityRole="button"
        onPress={() => {
          void openCreateTransaction()
        }}
        style={[styles.button, { top: insets.top + 4 }]}
      >
        <Text style={styles.label}>+ Movimiento</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    minWidth: 44,
    paddingHorizontal: 14,
    position: "absolute",
    right: 20,
  },
  label: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
  },
})
