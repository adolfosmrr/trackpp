import { forwardRef, useState } from "react"
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { colors, fonts, radii } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet"

import type { Category } from "../../categories/types"
import { TransactionBlurBackdrop } from "./TransactionBlurBackdrop"

type CategorySelectorSheetProps = {
  householdName: string
  categories: Category[] | undefined
  selectedCategoryId: string | null
  isLoading: boolean
  hasError: boolean
  onSelect: (category: Category) => void
}

export const CategorySelectorSheet = forwardRef<
  BottomSheetModal,
  CategorySelectorSheetProps
>(function CategorySelectorSheet(
  {
    householdName,
    categories,
    selectedCategoryId,
    isLoading,
    hasError,
    onSelect,
  },
  ref,
) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [hasScrolled, setHasScrolled] = useState(false)

  return (
    <BottomSheetModal
      ref={ref}
      style={styles.sheetContainer}
      onChange={(index) => {
        if (index === -1) {
          setHasScrolled(false)
        }
      }}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.6}
      enablePanDownToClose
      stackBehavior="push"
      backgroundStyle={styles.background}
      backdropComponent={(props) => <TransactionBlurBackdrop {...props} />}
    >
      <BottomSheetScrollView
        stickyHeaderIndices={[0]}
        onScroll={(event) => {
          const next = event.nativeEvent.contentOffset.y > 2

          setHasScrolled((current) =>
            current === next ? current : next,
          )
        }}
        contentContainerStyle={StyleSheet.flatten([
          styles.content,
          {
            paddingBottom: insets.bottom + 16,
          },
        ])}
      >
        <View
          style={[
            styles.header,
            hasScrolled && styles.headerShadow,
          ]}
        >
          <Text style={styles.title}>Categoría: {householdName}</Text>
        </View>
        <View style={styles.categoriesWrap}>
          {isLoading ? (
            <Text style={styles.status}>Cargando categorías...</Text>
          ) : hasError ? (
            <Text style={styles.status}>No se pudieron cargar las categorías.</Text>
          ) : categories?.length ? (
            categories.map((category) => (
              <Pressable
                key={category.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: category.id === selectedCategoryId }}
                onPress={() => onSelect(category)}
                style={[
                  styles.option,
                  category.id === selectedCategoryId && styles.optionSelected,
                ]}
              >
                <Text>{category.icon ?? ""}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    category.id === selectedCategoryId && styles.categoryNameSelected,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.status}>No hay categorías disponibles.</Text>
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    overflow: "hidden",
  },
  background: {
    backgroundColor: colors.popover,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: colors.popover,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerShadow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    fontWeight: "600",
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.sm,
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
    fontSize: 15,
    fontFamily: fonts.sansMedium,
    lineHeight: 16,
  },
  categoryNameSelected: {
    color: colors.brandForeground,
  },
  status: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    paddingHorizontal: 20,
  },
})
