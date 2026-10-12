import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useHouseholdCategories } from "../../categories/hooks/useHouseholdCategories"
import { selectionToken } from "../../../navigation/selectionToken"
import type { AppStackParamList, CategorySelection } from "../../../navigation/types"
import { colors, fonts, radii } from "../../../theme"

type CategoryPickerScreenProps = NativeStackScreenProps<AppStackParamList, "CategoryPicker">

export function CategoryPickerScreen({ navigation, route }: CategoryPickerScreenProps) {
  const insets = useSafeAreaInsets()
  const params = route.params
  const categoriesQuery = useHouseholdCategories(params.householdId, params.entryType)

  function selectCategory(category: { id: string; name: string; icon: string | null }) {
    const categorySelection: CategorySelection = {
      token: selectionToken(),
      householdId: params.householdId,
      categoryId: category.id,
      name: category.name,
      icon: category.icon,
    }

    if (params.returnTo === "PendingCharge") {
      navigation.popTo("PendingCharge", {
        chargeId: params.chargeId,
        categorySelection,
      }, { merge: true })
      return
    }

    if (params.returnTo === "BudgetEditor") {
      navigation.popTo("BudgetEditor", { categorySelection }, { merge: true })
      return
    }

    navigation.popTo("CreateMovement", { categorySelection }, { merge: true })
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Categoría: {params.householdName}</Text>
      <View style={styles.categoriesWrap}>
        {categoriesQuery.isLoading ? (
          <Text style={styles.status}>Cargando categorías...</Text>
        ) : categoriesQuery.isError ? (
          <Text style={styles.status}>No se pudieron cargar las categorías.</Text>
        ) : categoriesQuery.data?.length ? (
          categoriesQuery.data.map((category) => {
            const selected = category.id === params.selectedCategoryId
            return (
              <Pressable
                key={category.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => selectCategory(category)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text>{category.icon ?? ""}</Text>
                <Text style={[styles.categoryName, selected && styles.categoryNameSelected]}>
                  {category.name}
                </Text>
              </Pressable>
            )
          })
        ) : (
          <Text style={styles.status}>No hay categorías disponibles.</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  categoriesWrap: {
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
  categoryName: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 16,
  },
  categoryNameSelected: {
    color: colors.brandForeground,
  },
  status: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
  },
})
