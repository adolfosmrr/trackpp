import {
    Text,
    Pressable,
    StyleSheet,
  } from "react-native"
  import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native"
  import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
  import { colors, fonts } from "../../../theme"
  import { GlassButton } from "../../../components/buttons/GlassButton"
  
  import { useHouseholds } from "../hooks/useHouseholds"
  import { useHouseholdStore } from "../../../store/householdStore"

  import { ChevronDownIcon } from "../../../components/icons/ChevronDownIcon"
  import type { AppStackParamList } from "../../../navigation/types"

  export function HouseholdSwitcher({ compact = false }: { compact?: boolean }) {
    const navigation = useNavigation<NavigationProp<ParamListBase>>()
  
    const selectedHouseholdId = useHouseholdStore(
      (state) => state.selectedHouseholdId
    )
  
    const {
      data: memberships,
      isLoading,
    } = useHouseholds()
  
    const currentHousehold = memberships?.find(
      (membership) =>
        membership.household.id === selectedHouseholdId
    )?.household

    function openSelectSpace() {
      const parent = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()
      if (parent?.getState().routeNames.includes("SelectSpace")) {
        parent.navigate("SelectSpace")
        return
      }
      navigation.navigate("SelectSpace")
    }
  
    if (isLoading) {
      return (
        compact ? (
          <Text style={styles.compactLoading}>
            Cargando...
          </Text>
        ) : (
          <Text style={styles.loading}>Cargando...</Text>
        )
      )
    }
  
    return (
      <SpaceSelectorButton
        compact={compact}
        label={currentHousehold?.name ?? "Seleccionar espacio"}
        onPress={openSelectSpace}
      />
    )
  }

  function SpaceSelectorButton({
    compact,
    label,
    onPress,
  }: {
    compact: boolean
    label: string
    onPress: () => void
  }) {
    const content = (
      <>
        <Text
          numberOfLines={1}
          style={[styles.triggerText, compact && styles.compactTriggerText]}
        >
          {label}
        </Text>
        {compact ? <ChevronDownIcon /> : <Text style={styles.chevron}>▼</Text>}
      </>
    )

    if (compact) {
      return (
        <GlassButton
          accessibilityLabel="Cambiar cuenta"
          fallbackStyle={styles.compactTrigger}
          glassStyle={styles.glassTrigger}
          hitSlop={10}
          onPress={onPress}
          style={styles.glassPressable}
        >
          {content}
        </GlassButton>
      )
    }

    return (
      <Pressable
        accessibilityLabel="Cambiar cuenta"
        accessibilityRole="button"
        onPress={onPress}
        style={styles.trigger}
      >
        {content}
      </Pressable>
    )
  }

  const styles = StyleSheet.create({
    loading: {
      color: colors.mutedForeground,
      fontFamily: fonts.sans,
    },

    compactLoading: {
      height: 40,
      justifyContent: "center",
      marginLeft: 15,
    },
  
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
  
    triggerText: {
      color: colors.foreground,
      fontFamily: fonts.sansMedium,
      fontSize: 15,
      fontWeight: "600",
    },

    compactTrigger: {
      alignItems: "center",
      backgroundColor: colors.transparent,
      borderColor: colors.borderStrong,
      borderWidth: 1,
      flexShrink: 1,
      gap: 8,
      height: 40,
      marginLeft: 15,
      paddingHorizontal: 20,
    },

    glassTrigger: {
      flexShrink: 1,
      height: 40,
      marginLeft: 15,
    },

    glassPressable: {
      alignItems: "center",
      backgroundColor: colors.transparent,
      flexDirection: "row",
      gap: 8,
      height: 40,
      paddingHorizontal: 20,
    },

    compactTriggerText: {
      color: colors.foreground,
      fontFamily: fonts.sansMedium,
      fontSize: 16,
      lineHeight: 16,
      fontWeight: undefined,
    },
  
    chevron: {
      fontSize: 10,
      color: colors.mutedForeground,
    },
  })
