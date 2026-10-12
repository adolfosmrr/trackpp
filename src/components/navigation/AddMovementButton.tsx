import { StyleSheet } from "react-native"

import { useCreateTransactionSheet } from "../../features/transactions/components/CreateTransactionSheetProvider"
import { fonts } from "../../theme"
import { Button } from "../buttons/Button"

export function AddMovementButton() {
  const { openCreateTransaction } = useCreateTransactionSheet()

  return (
    <Button
      accessibilityLabel="Agregar movimiento"
      hitSlop={{ top: 2, bottom: 2 }}
      label="+ Movimiento"
      labelStyle={styles.label}
      onPress={() => {
        void openCreateTransaction()
      }}
      size="compact"
      style={styles.button}
      tone="brand"
    />
  )
}

const styles = StyleSheet.create({
  button: {
    flexShrink: 0,
  },
  label: {
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
  },
})
