import { forwardRef, useState } from "react"
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"
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
          <Text style={styles.title}>Añadir a</Text>
        </View>
        {memberships.map((membership) => {
          const household = membership.household
          const selected = selectedHouseholdIds.includes(household.id)

          return (
            <Pressable
              key={household.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => toggleHousehold(household.id)}
              style={styles.option}
            >
              <Text style={styles.optionText}>{household.name}</Text>
              <Text style={styles.optionType}>
                {household.type === "couple" ? "Compartido" : "Personal"}
              </Text>
              <Text style={styles.check}>{selected ? "✓" : "○"}</Text>
            </Pressable>
          )
        })}
        <Pressable style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneText}>Listo</Text>
        </Pressable>
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
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  optionType: {
    color: "#777",
    fontSize: 13,
  },
  check: {
    fontSize: 20,
    width: 24,
  },
  doneButton: {
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 24,
    padding: 14,
  },
  doneText: {
    color: "#fff",
    fontWeight: "600",
  },
})
