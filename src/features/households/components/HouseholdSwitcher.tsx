import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
  } from "react-native"
  import { useState } from "react"
  import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"
  
  import { useHouseholds } from "../hooks/useHouseholds"
  import { useHouseholdStore } from "../../../store/householdStore"

  import { ChevronDownIcon } from "../../../components/icons/ChevronDownIcon"

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
  
  export function HouseholdSwitcher({ compact = false, collapseProgress }: { compact?: boolean; collapseProgress?: SharedValue<number> }) {
    const [open, setOpen] = useState(false)
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
          style={[styles.trigger, compact && styles.compactTrigger, compact && compactAnimatedStyle]}
          onPress={() => setOpen(true)}
        >
          <Text style={[styles.triggerText, compact && styles.compactTriggerText]}>
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
            </Pressable>
          </Pressable>
        </Modal>
      </>
    )
  }

  function useCompactAnimatedStyle(collapseProgress?: SharedValue<number>) {
    return useAnimatedStyle(() => ({
      height: interpolate(collapseProgress?.value ?? 0, [0, 1], [40, 24]),
      paddingHorizontal: interpolate(collapseProgress?.value ?? 0, [0, 1], [20, 12]),
    }))
  }
  
  const styles = StyleSheet.create({
    loading: {
      color: "#777",
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
      fontSize: 15,
      fontWeight: "600",
    },

    compactTrigger: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 9999,
      gap: 8,
      height: 40,
      marginLeft: 15,
      paddingHorizontal: 20,
    },

    compactTriggerText: {
      color: "#1C1C1C",
      fontFamily: "FamiljenGrotesk-Bold",
      fontSize: 16,
      lineHeight: 16,
      fontWeight: undefined,
    },
  
    chevron: {
      fontSize: 10,
      color: "#777",
    },
  
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      justifyContent: "center",
      padding: 24,
    },
  
    modal: {
      backgroundColor: "#fff",
      borderRadius: 18,
      padding: 20,
      gap: 12,
    },
  
    title: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
    },
  
    option: {
      padding: 14,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  
    optionSelected: {
      backgroundColor: "#111",
      borderColor: "#111",
    },
  
    optionName: {
      fontSize: 16,
      fontWeight: "600",
    },
  
    optionNameSelected: {
      color: "#fff",
    },
  
    optionType: {
      marginTop: 3,
      color: "#777",
      fontSize: 13,
    },
  
    optionTypeSelected: {
      color: "#ccc",
    },
  
    check: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
    },
  })
