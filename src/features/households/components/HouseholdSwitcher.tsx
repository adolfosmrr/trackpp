import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
  } from "react-native"
  import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native"
  import { sheetChrome } from "../../../components/layout/AppSheet"
import { colors, fonts, radii } from "../../../theme"
  import { Button } from "../../../components/buttons/Button"
  import { GlassButton } from "../../../components/buttons/GlassButton"
  import { useState } from "react"
  
  import { useHouseholds } from "../hooks/useHouseholds"
  import { useHouseholdStore } from "../../../store/householdStore"

  import { ChevronDownIcon } from "../../../components/icons/ChevronDownIcon"
  import type { AppStackParamList } from "../../../navigation/types"

  export function HouseholdSwitcher({ compact = false }: { compact?: boolean }) {
    const [open, setOpen] = useState(false)
    const navigation = useNavigation<NavigationProp<ParamListBase>>()
  
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
      const parent = navigation.getParent<NavigationProp<AppStackParamList>>()
      if (parent && parent.getState().routeNames.includes("CreateHousehold")) {
        parent.navigate("CreateHousehold")
        return
      }
      navigation.navigate("CreateHousehold")
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
      <>
        <SpaceSelectorButton
          compact={compact}
          label={currentHousehold?.name ?? "Seleccionar espacio"}
          onPress={() => setOpen(true)}
        />
  
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
              style={[styles.modal, sheetChrome.dialog]}
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

              <Button
                label="+ Crear espacio"
                labelStyle={styles.createOptionText}
                onPress={openCreateHousehold}
                tone="outline"
              />
            </Pressable>
          </Pressable>
        </Modal>
      </>
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
  
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: 24,
    },
  
    modal: {
      backgroundColor: colors.popover,
      borderColor: colors.border,
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
      borderRadius: radii.pill,
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

    createOptionText: {
      color: colors.brand,
      fontFamily: fonts.sansMedium,
      fontSize: 16,
      fontWeight: "600",
    },
  })
