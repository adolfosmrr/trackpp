import { forwardRef, useState } from "react"
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { Button } from "../../../components/buttons/Button"
import { AppSheet } from "../../../components/layout/AppSheet"
import { colors, fonts, radii } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet"

import type { HouseholdMembership } from "../../households/types"
import { TransactionBlurBackdrop } from "./TransactionBlurBackdrop"

type HouseholdSelectorSheetProps = {
  memberships: HouseholdMembership[]
  selectedHouseholdIds: string[]
  onChange: (householdIds: string[]) => void
  onDone: () => void
  selectionMode?: "multiple" | "single"
  title?: string
}

export const HouseholdSelectorSheet = forwardRef<
  BottomSheetModal,
  HouseholdSelectorSheetProps
>(function HouseholdSelectorSheet(
  {
    memberships,
    selectedHouseholdIds,
    onChange,
    onDone,
    selectionMode = "multiple",
    title = "Añadir a",
  },
  ref,
) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [hasScrolled, setHasScrolled] = useState(false)

  function toggleHousehold(householdId: string) {
    if (selectionMode === "single") {
      onChange([householdId])
      return
    }

    const isSelected = selectedHouseholdIds.includes(householdId)
    if (isSelected && selectedHouseholdIds.length === 1) {
      return
    }

    onChange(
      isSelected
        ? selectedHouseholdIds.filter((id) => id !== householdId)
        : [...selectedHouseholdIds, householdId],
    )
  }

  return (
    <AppSheet
      ref={ref}
      onChange={(index) => {
        if (index === -1) {
          setHasScrolled(false)
        }
      }}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.6}
      enablePanDownToClose
      stackBehavior="push"
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
            paddingBottom: insets.bottom,
          },
        ])}
      >
        <View
          style={[
            styles.header,
            hasScrolled && styles.headerShadow,
          ]}
        >
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.householdsWrap}>
          {memberships.map((membership) => {
            const household = membership.household
            const selected = selectedHouseholdIds.includes(household.id)

            return (
              <Pressable
                key={household.id}
                accessibilityRole={selectionMode === "single" ? "radio" : "checkbox"}
                accessibilityState={
                  selectionMode === "single" ? { selected } : { checked: selected }
                }
                onPress={() => toggleHousehold(household.id)}
                style={[
                  styles.option,
                  selected && styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {household.name}
                </Text>
                <Text
                  style={[
                    styles.optionType,
                    selected && styles.optionTypeSelected,
                  ]}
                >
                  {household.type === "couple" ? "Compartido" : "Personal"}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <View style={styles.done}>
          <Button label="Listo" onPress={onDone} tone="brand" />
        </View>
      </BottomSheetScrollView>
    </AppSheet>
  )
})

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingHorizontal: 0,
    paddingTop: 0
  },
  householdsWrap: {
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
  done: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
  optionText: {
    color: colors.foreground,
    fontSize: 15,
    fontFamily: fonts.sansMedium,
    lineHeight: 16,
  },
  optionTextSelected: {
    color: colors.brandForeground,
  },
  optionType: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  optionTypeSelected: {
    color: colors.brandForeground,
  },
})
