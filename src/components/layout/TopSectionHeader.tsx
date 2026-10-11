import { memo } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { ProfileAvatar } from "../profile/ProfileAvatar"
import type { Profile } from "../../features/profile/services/profileService"
import { openProfileMenu } from "../../features/profile/profileMenu"
import { HouseholdSwitcher } from "../../features/households/components/HouseholdSwitcher"
import { AddMovementButton } from "../navigation/AddMovementButton"

type TopSectionHeaderProps = {
  profile?: Pick<Profile, "name" | "avatar_url"> | null
}

export const TopSectionHeader = memo(function TopSectionHeader({ profile }: TopSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Abrir perfil"
        accessibilityRole="button"
        hitSlop={12}
        onPress={openProfileMenu}
      >
        <ProfileAvatar name={profile?.name} uri={profile?.avatar_url} />
      </Pressable>
      <HouseholdSwitcher compact />
      <View style={styles.spacer} />
      <AddMovementButton />
    </View>
  )
})

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  spacer: {
    flex: 1,
    minWidth: 12,
  },
})
