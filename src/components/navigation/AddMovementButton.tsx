import { StyleSheet } from "react-native"
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { createMovementParams } from "../../features/transactions/openCreateMovement"
import type { AppStackParamList } from "../../navigation/types"
import { fonts } from "../../theme"
import { Button } from "../buttons/Button"

export function AddMovementButton() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()

  return (
    <Button
      accessibilityLabel="Agregar movimiento"
      hitSlop={{ top: 2, bottom: 2 }}
      label="+ Movimiento"
      labelStyle={styles.label}
      onPress={() => {
        const parent = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()
        if (!parent) return
        void createMovementParams().then((params) => {
          parent.navigate("CreateMovement", params)
        })
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
