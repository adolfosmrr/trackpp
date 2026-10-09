import { memo } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"

import { TOP_AVATAR_SIZE } from "./topSectionCollapse"

import { ProfileAvatar } from "../profile/ProfileAvatar"
import type { Profile } from "../../features/profile/services/profileService"
import { openProfileMenu } from "../../features/profile/profileMenu"
import { HouseholdSwitcher } from "../../features/households/components/HouseholdSwitcher"

type TopSectionHeaderProps = {
  profile?: Pick<Profile, "name" | "avatar_url"> | null
  collapseProgress: SharedValue<number>
}

export const TopSectionHeader = memo(function TopSectionHeader({ profile, collapseProgress }: TopSectionHeaderProps) {
  const avatarStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(collapseProgress.value, [0, 1], [20, 12]),
    height: interpolate(collapseProgress.value, [0, 1], TOP_AVATAR_SIZE),
    width: interpolate(collapseProgress.value, [0, 1], TOP_AVATAR_SIZE),
  }))

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Abrir perfil"
        accessibilityRole="button"
        hitSlop={12}
        onPress={openProfileMenu}
      >
        <ProfileAvatar name={profile?.name} uri={profile?.avatar_url} style={avatarStyle} />
      </Pressable>
      <HouseholdSwitcher collapseProgress={collapseProgress} compact />
    </View>
  )
})

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    paddingRight: 168,
    width: "100%",
  },
})
