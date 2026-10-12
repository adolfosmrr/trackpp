import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "../../../components/buttons/Button"
import { useHouseholdStore } from "../../../store/householdStore"
import { colors, fonts, radii } from "../../../theme"
import type { AppStackParamList } from "../../../navigation/types"
import { useHouseholds } from "../hooks/useHouseholds"

type SelectSpaceScreenProps = NativeStackScreenProps<AppStackParamList, "SelectSpace">

export function SelectSpaceScreen({ navigation }: SelectSpaceScreenProps) {
  const insets = useSafeAreaInsets()
  const { data: memberships, isLoading } = useHouseholds()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const setSelectedHouseholdId = useHouseholdStore((state) => state.setSelectedHouseholdId)

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
    >
      <Text style={styles.title}>Espacios</Text>
      {isLoading ? <Text style={styles.loading}>Cargando...</Text> : null}
      {memberships?.map((membership) => {
        const household = membership.household
        const selected = household.id === selectedHouseholdId
        return (
          <Pressable
            key={household.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              setSelectedHouseholdId(household.id)
              navigation.goBack()
            }}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <View>
              <Text style={[styles.optionName, selected && styles.optionNameSelected]}>
                {household.name}
              </Text>
              <Text style={[styles.optionType, selected && styles.optionTypeSelected]}>
                {household.type === "personal" ? "Personal" : "Compartido"}
              </Text>
            </View>
            {selected ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        )
      })}
      <Button
        label="+ Crear espacio"
        labelStyle={styles.createOptionText}
        onPress={() => navigation.navigate("CreateHousehold")}
        tone="outline"
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loading: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  option: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },
  optionSelected: {
    backgroundColor: colors.brandMuted,
    borderColor: colors.brand,
  },
  optionName: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    fontWeight: "600",
  },
  optionNameSelected: {
    color: colors.brand,
  },
  optionType: {
    color: colors.mutedForeground,
    fontSize: 13,
    marginTop: 3,
  },
  optionTypeSelected: {
    color: colors.brand,
  },
  check: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: "700",
  },
  createOptionText: {
    color: colors.brand,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    fontWeight: "600",
  },
})
