import { forwardRef, useCallback, useState } from "react"
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { colors, fonts, radii } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
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

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter
        {...props}
        bottomInset={insets.bottom}
        style={styles.footer}
      >
        <Pressable style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneText}>Listo</Text>
        </Pressable>
      </BottomSheetFooter>
    ),
    [insets.bottom, onDone],
  )

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
      footerComponent={renderFooter}
    >
      <BottomSheetScrollView
        stickyHeaderIndices={[0]}
        enableFooterMarginAdjustment
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
  footer: {
    backgroundColor: colors.popover,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
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
  doneButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.sm,
    padding: 14,
  },
  doneText: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontWeight: "600",
  },
})
