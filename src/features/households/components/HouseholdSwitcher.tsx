import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
  } from "react-native"
  import { useNavigation } from "@react-navigation/native"
  import { colors, fonts, radii } from "../../../theme"
  import { useState } from "react"
  import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"
  
  import { useHouseholds } from "../hooks/useHouseholds"
  import { useHouseholdStore } from "../../../store/householdStore"

  import { ChevronDownIcon } from "../../../components/icons/ChevronDownIcon"
  import { TOP_HEADER_HEIGHT } from "../../../components/layout/topSectionCollapse"

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
  
  export function HouseholdSwitcher({ compact = false, collapseProgress }: { compact?: boolean; collapseProgress?: SharedValue<number> }) {
    const [open, setOpen] = useState(false)
    const navigation = useNavigation<any>()
    const compactAnimatedStyle = useCompactAnimatedStyle(collapseProgress)
  
    const selectedHouseholdId = useHouseholdStore(
      (state) => state.selectedHouseholdId
    )
  
    const setSelectedHouseholdId = useHouseholdStore(
      (state) => state.setSelectedHouseholdId
    )
  
    const {
      data: memberships,
      isLoading,
    } = useHouseholds()
  
    const currentHousehold = memberships?.find(
      (membership) =>
        membership.household.id === selectedHouseholdId
    )?.household

    function openCreateHousehold() {
      setOpen(false)
      const parent = navigation.getParent?.()
      if (parent?.getState?.().routeNames?.includes("CreateHousehold")) {
        parent.navigate("CreateHousehold")
        return
      }
      navigation.navigate("CreateHousehold")
    }
  
    if (isLoading) {
      return (
        compact ? (
          <Animated.Text style={[styles.compactLoading, compactAnimatedStyle]}>
            Cargando...
          </Animated.Text>
        ) : (
          <Text style={styles.loading}>Cargando...</Text>
        )
      )
    }
  
    return (
      <>
        <AnimatedPressable
          accessibilityLabel="Cambiar cuenta"
          accessibilityRole="button"
          hitSlop={compact ? 10 : 0}
          style={[styles.trigger, compact && styles.compactTrigger, compact && compactAnimatedStyle]}
          onPress={() => setOpen(true)}
        >
          <Text
            numberOfLines={1}
            style={[styles.triggerText, compact && styles.compactTriggerText]}
          >
            {currentHousehold?.name ?? "Seleccionar espacio"}
          </Text>
  
          {compact ? <ChevronDownIcon /> : <Text style={styles.chevron}>▼</Text>}
        </AnimatedPressable>
  
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setOpen(false)}
          >
            <Pressable
              style={styles.modal}
              onPress={() => {}}
            >
              <Text style={styles.title}>
                Espacios
              </Text>
  
              {memberships?.map((membership) => {
                const household =
                  membership.household
  
                const selected =
                  household.id ===
                  selectedHouseholdId
  
                return (
                  <Pressable
                    key={household.id}
                    style={[
                      styles.option,
                      selected &&
                        styles.optionSelected,
                    ]}
                    onPress={() => {
                      setSelectedHouseholdId(
                        household.id
                      )
  
                      setOpen(false)
                    }}
                  >
                    <View>
                      <Text
                        style={[
                          styles.optionName,
                          selected &&
                            styles.optionNameSelected,
                        ]}
                      >
                        {household.name}
                      </Text>
  
                      <Text
                        style={[
                          styles.optionType,
                          selected &&
                            styles.optionTypeSelected,
                        ]}
                      >
                        {household.type === "personal"
                          ? "Personal"
                          : "Compartido"}
                      </Text>
                    </View>
  
                    {selected && (
                      <Text
                        style={styles.check}
                      >
                        ✓
                      </Text>
                    )}
                  </Pressable>
                )
              })}

              <Pressable
                accessibilityRole="button"
                style={styles.createOption}
                onPress={openCreateHousehold}
              >
                <Text style={styles.createOptionText}>+ Crear espacio</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    )
  }

  function useCompactAnimatedStyle(collapseProgress?: SharedValue<number>) {
    return useAnimatedStyle(() => ({
      height: interpolate(collapseProgress?.value ?? 0, [0, 1], TOP_HEADER_HEIGHT),
      paddingHorizontal: interpolate(collapseProgress?.value ?? 0, [0, 1], [20, 12]),
    }))
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
      borderRadius: radii.md,
      borderWidth: 1,
      flexShrink: 1,
      gap: 8,
      height: 40,
      marginLeft: 15,
      paddingHorizontal: 12,
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
  
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: 24,
    },
  
    modal: {
      backgroundColor: colors.popover,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      padding: 20,
      gap: 12,
    },
  
    title: {
      color: colors.foreground,
      fontFamily: fonts.sansSemibold,
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 4,
    },
  
    option: {
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
      marginTop: 3,
      color: colors.mutedForeground,
      fontSize: 13,
    },
  
    optionTypeSelected: {
      color: colors.brand,
    },

    check: {
      color: colors.brand,
      fontSize: 18,
      fontWeight: "700",
    },

    createOption: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: radii.sm,
      borderWidth: 1,
      padding: 14,
    },

    createOptionText: {
      color: colors.brand,
      fontFamily: fonts.sansMedium,
      fontSize: 16,
      fontWeight: "600",
    },
  })
