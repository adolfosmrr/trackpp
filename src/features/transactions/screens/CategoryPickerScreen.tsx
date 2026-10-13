import { Pressable, StyleSheet, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import { CustomCategoryBar } from "../../categories/components/CustomCategoryBar"
import { useHouseholdCategories } from "../../categories/hooks/useHouseholdCategories"
import { selectionToken } from "../../../navigation/selectionToken"
import type { AppStackParamList, CategorySelection } from "../../../navigation/types"
import { colors, radii } from "../../../theme"

type CategoryPickerScreenProps = NativeStackScreenProps<AppStackParamList, "CategoryPicker">

export function CategoryPickerScreen({ navigation, route }: CategoryPickerScreenProps) {
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
    <SheetScaffold onClose={() => navigation.goBack()} title={`Categoría: ${params.householdName}`}>
      <CustomCategoryBar
        categories={categoriesQuery.data}
        householdId={params.householdId}
        onCreated={selectCategory}
        type={params.entryType}
      />
      <View style={styles.categoriesWrap}>
        {categoriesQuery.isLoading ? (
          <AppText tone="muted" variant="body">Cargando categorías...</AppText>
        ) : categoriesQuery.isError ? (
          <AppText tone="muted" variant="body">No se pudieron cargar las categorías.</AppText>
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
                <AppText variant="subtitle">{category.icon ?? ""}</AppText>
                <AppText
                  style={styles.categoryName}
                  tone={selected ? "onBrand" : "default"}
                  variant="subtitle"
                >
                  {category.name}
                </AppText>
              </Pressable>
            )
          })
        ) : (
          <AppText tone="muted" variant="body">No hay categorías disponibles.</AppText>
        )}
      </View>
    </SheetScaffold>
  )
}

const styles = StyleSheet.create({
  categoriesWrap: {
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
  categoryName: {
    flexShrink: 1,
  },
})
