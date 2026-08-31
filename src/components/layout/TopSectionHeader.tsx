import { Pressable, StyleSheet, Text, View } from "react-native"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"

import { PlusIcon } from "../icons/PlusIcon"
import { ProfileAvatar } from "../profile/ProfileAvatar"
import type { Profile } from "../../features/profile/services/profileService"
import { HouseholdSwitcher } from "../../features/households/components/HouseholdSwitcher"
import { useCreateTransactionSheet } from "../../features/transactions/components/CreateTransactionSheetProvider"

type TopSectionHeaderProps = {
  profile?: Pick<Profile, "name" | "avatar_url"> | null
  collapseProgress: SharedValue<number>
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function TopSectionHeader({ profile, collapseProgress }: TopSectionHeaderProps) {
  const { openCreateTransaction } = useCreateTransactionSheet()
  const avatarStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(collapseProgress.value, [0, 1], [20, 12]),
    height: interpolate(collapseProgress.value, [0, 1], [40, 24]),
    width: interpolate(collapseProgress.value, [0, 1], [40, 24]),
  }))
  const addButtonStyle = useAnimatedStyle(() => ({
    height: interpolate(collapseProgress.value, [0, 1], [40, 24]),
    paddingHorizontal: interpolate(collapseProgress.value, [0, 1], [0, 12]),
    width: interpolate(collapseProgress.value, [0, 1], [40, 122]),
  }))
  const addIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.55, 1], [1, 0, 0]),
  }))
  const addTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.45, 1], [0, 0, 1]),
  }))

  return (
    <View style={styles.row}>
      <ProfileAvatar name={profile?.name} uri={profile?.avatar_url} style={avatarStyle} />
      <HouseholdSwitcher collapseProgress={collapseProgress} compact />
      <AnimatedPressable
        accessibilityLabel="Agregar movimiento"
        accessibilityRole="button"
        onPress={() => openCreateTransaction()}
        style={[styles.addButton, addButtonStyle]}
      >
        <Animated.View style={addIconStyle}>
          <PlusIcon />
        </Animated.View>
        <Animated.Text style={[styles.addText, addTextStyle]}>+ Movimiento</Animated.Text>
      </AnimatedPressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginLeft: "auto",
    flexDirection: "row",
    overflow: "hidden",
    width: 40,
  },
  addText: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
    position: "absolute",
  },
})
