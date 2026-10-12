import { StyleSheet, Text } from "react-native"
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import type { AppStackParamList } from "../../../navigation/types"
import { colors, fonts } from "../../../theme"
import { useHouseholdStore } from "../../../store/householdStore"
import { useHouseholds } from "../hooks/useHouseholds"
import { SpaceMenu } from "./SpaceMenu"
import { spaceSubtitle } from "./spaceMenu"

export function HouseholdSwitcher({ compact = false }: { compact?: boolean }) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const setSelectedHouseholdId = useHouseholdStore((state) => state.setSelectedHouseholdId)
  const { data: memberships, isLoading } = useHouseholds()
  const currentHousehold = memberships?.find(
    (membership) => membership.household.id === selectedHouseholdId,
  )?.household

  function openCreateSpace() {
    const parent = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()
    if (parent?.getState().routeNames.includes("CreateHousehold")) {
      parent.navigate("CreateHousehold")
      return
    }
    navigation.navigate("CreateHousehold")
  }

  if (isLoading) {
    return (
      <Text style={compact ? styles.compactLoading : styles.loading}>
        Cargando...
      </Text>
    )
  }

  return (
    <SpaceMenu
      compact={compact}
      items={(memberships ?? []).map((membership) => ({
        id: membership.household.id,
        name: membership.household.name,
        subtitle: spaceSubtitle(membership.household.type, membership.household.currency),
        selected: membership.household.id === selectedHouseholdId,
      }))}
      label={currentHousehold?.name ?? "Seleccionar espacio"}
      onCreate={openCreateSpace}
      onSelect={setSelectedHouseholdId}
    />
  )
}

const styles = StyleSheet.create({
  loading: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
  },
  compactLoading: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    height: 40,
    marginLeft: 15,
  },
})
