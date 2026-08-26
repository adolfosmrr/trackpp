import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
  } from "react-native"
  import { useState } from "react"
  
  import { useHouseholds } from "../hooks/useHouseholds"
  import { useHouseholdStore } from "../../../store/householdStore"

  import {
    useNavigation,
  } from "@react-navigation/native"
  
  export function HouseholdSwitcher() {
    const navigation = useNavigation<any>()
    const [open, setOpen] = useState(false)
  
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
        <Text style={styles.loading}>
          Cargando...
        </Text>
      )
    }
  
    return (
      <>
        <Pressable
          style={styles.trigger}
          onPress={() => setOpen(true)}
        >
          <Text style={styles.triggerText}>
            {currentHousehold?.name ?? "Seleccionar espacio"}
          </Text>
  
          <Text style={styles.chevron}>
            ▼
          </Text>
        </Pressable>
  
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
        <Pressable
  style={styles.createOption}
  onPress={() => {
    setOpen(false)

    navigation.navigate(
      "CreateHousehold"
    )
  }}
>
  <Text
    style={styles.createOptionText}
  >
    + Crear espacio compartido
  </Text>
</Pressable>
      </>
    )
  }
  
  const styles = StyleSheet.create({
    loading: {
      color: "#777",
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
    createOption: {
        padding: 14,
        alignItems: "center",
        marginTop: 4,
      },
      
      createOptionText: {
        fontWeight: "700",
      },
  })