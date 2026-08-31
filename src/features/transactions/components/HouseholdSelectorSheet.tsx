import { forwardRef, useCallback, useState } from "react"
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"
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
}

export const HouseholdSelectorSheet = forwardRef<
  BottomSheetModal,
  HouseholdSelectorSheetProps
>(function HouseholdSelectorSheet(
  { memberships, selectedHouseholdIds, onChange, onDone },
  ref,
) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [hasScrolled, setHasScrolled] = useState(false)

  function toggleHousehold(householdId: string) {
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
          <Text style={styles.title}>Añadir a</Text>
        </View>
        <View style={styles.householdsWrap}>
          {memberships.map((membership) => {
            const household = membership.household
            const selected = selectedHouseholdIds.includes(household.id)

            return (
              <Pressable
                key={household.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
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
  footer: {
    backgroundColor: "#E6E6E6",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  option: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  optionSelected: {
    backgroundColor: "#1C1C1C",
  },
  optionText: {
    color: "#1C1C1C",
    fontSize: 16,
    fontFamily: "FamiljenGrotesk-Bold",
    lineHeight: 16,
  },
  optionTextSelected: {
    color: "#FFFFFF",
  },
  optionType: {
    color: "#777",
    fontSize: 13,
  },
  optionTypeSelected: {
    color: "rgba(255,255,255,0.65)",
  },
  doneButton: {
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 999,
    padding: 14,
  },
  doneText: {
    color: "#fff",
    fontWeight: "600",
  },
})
