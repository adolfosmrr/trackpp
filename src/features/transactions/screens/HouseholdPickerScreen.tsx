import { useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "../../../components/buttons/Button"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { selectionToken } from "../../../navigation/selectionToken"
import type { AppStackParamList, HouseholdSelection } from "../../../navigation/types"
import { colors, fonts, radii } from "../../../theme"

type HouseholdPickerScreenProps = NativeStackScreenProps<AppStackParamList, "HouseholdPicker">

export function HouseholdPickerScreen({ navigation, route }: HouseholdPickerScreenProps) {
  const insets = useSafeAreaInsets()
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
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{params.title}</Text>
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
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {household.name}
              </Text>
              <Text style={[styles.optionType, selected && styles.optionTypeSelected]}>
                {household.type === "couple" ? "Compartido" : "Personal"}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <Button label="Listo" onPress={commit} tone="brand" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  householdsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    fontWeight: "600",
    paddingBottom: 4,
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
  optionText: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 16,
  },
  optionTextSelected: {
    color: colors.brandForeground,
  },
  optionType: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  optionTypeSelected: {
    color: colors.brandForeground,
  },
})
