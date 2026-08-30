import { forwardRef, useState } from "react"
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      >
        <View
          style={[
            styles.header,
            hasScrolled && styles.headerShadow,
          ]}
        >
          <Text style={styles.title}>Categoría: {householdName}</Text>
        </View>
        {isLoading ? (
          <Text>Cargando categorías...</Text>
        ) : hasError ? (
          <Text>No se pudieron cargar las categorías.</Text>
        ) : categories?.length ? (
          categories.map((category) => (
            <Pressable
              key={category.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: category.id === selectedCategoryId }}
              onPress={() => onSelect(category)}
              style={styles.option}
            >
              <Text style={styles.icon}>{category.icon ?? ""}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.id === selectedCategoryId ? (
                <Text style={styles.check}>✓</Text>
              ) : null}
            </Pressable>
          ))
        ) : (
          <Text>No hay categorías disponibles.</Text>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    overflow: "hidden",
  },
  background: {
    backgroundColor: "#E6E6E6",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  header: {
    backgroundColor: "#E6E6E6",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerShadow: {
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  option: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  icon: {
    width: 24,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
  },
  check: {
    fontSize: 20,
  },
})
