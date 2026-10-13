import { useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Button } from "../../../components/buttons/Button"
import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { selectionToken } from "../../../navigation/selectionToken"
import type { AppStackParamList, HouseholdSelection } from "../../../navigation/types"
import { colors, radii } from "../../../theme"

type HouseholdPickerScreenProps = NativeStackScreenProps<AppStackParamList, "HouseholdPicker">

export function HouseholdPickerScreen({ navigation, route }: HouseholdPickerScreenProps) {
  const params = route.params
  const { data: memberships } = useHouseholds()
  const [selectedHouseholdIds, setSelectedHouseholdIds] = useState(params.selectedHouseholdIds)

  function toggleHousehold(householdId: string) {
    if (params.selectionMode === "single") {
      setSelectedHouseholdIds([householdId])
      return
    }

    setSelectedHouseholdIds((current) => {
      const isSelected = current.includes(householdId)
      if (isSelected && current.length === 1) return current
      return isSelected
        ? current.filter((id) => id !== householdId)
        : [...current, householdId]
    })
  }

  function commit() {
    if (selectedHouseholdIds.length === 0) return

    const householdSelection: HouseholdSelection = {
      token: selectionToken(),
      householdIds: selectedHouseholdIds,
    }

    if (params.returnTo === "PendingCharge") {
      navigation.popTo("PendingCharge", {
        chargeId: params.chargeId,
        householdSelection,
      }, { merge: true })
      return
    }

    navigation.popTo("CreateMovement", { householdSelection }, { merge: true })
  }

  return (
    <SheetScaffold onClose={() => navigation.goBack()} title={params.title}>
      <View style={styles.householdsWrap}>
        {memberships?.map((membership) => {
          const household = membership.household
          const selected = selectedHouseholdIds.includes(household.id)
          return (
            <Pressable
              key={household.id}
              accessibilityRole={params.selectionMode === "single" ? "radio" : "checkbox"}
              accessibilityState={
                params.selectionMode === "single" ? { selected } : { checked: selected }
              }
              onPress={() => toggleHousehold(household.id)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <AppText tone={selected ? "onBrand" : "default"} variant="subtitle">
                {household.name}
              </AppText>
              <AppText tone={selected ? "onBrand" : "muted"} variant="caption">
                {household.type === "couple" ? "Compartido" : "Personal"}
              </AppText>
            </Pressable>
          )
        })}
      </View>
      <Button label="Listo" onPress={commit} tone="brand" />
    </SheetScaffold>
  )
}

const styles = StyleSheet.create({
  householdsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  optionSelected: {
    backgroundColor: colors.brand,
  },
})
