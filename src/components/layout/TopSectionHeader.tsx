import { memo } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { ProfileAvatar } from "../profile/ProfileAvatar"
import type { Profile } from "../../features/profile/services/profileService"
import { HouseholdSwitcher } from "../../features/households/components/HouseholdSwitcher"
import { AddMovementButton } from "../navigation/AddMovementButton"
import type { AppStackParamList } from "../../navigation/types"

type TopSectionHeaderProps = {
  profile?: Pick<Profile, "name" | "avatar_url"> | null
}

export const TopSectionHeader = memo(function TopSectionHeader({ profile }: TopSectionHeaderProps) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()

  function openProfile() {
    const parent = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()
    if (parent?.getState().routeNames.includes("Profile")) {
      parent.navigate("Profile")
      return
    }
    navigation.navigate("Profile")
  }

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Abrir perfil"
        accessibilityRole="button"
        hitSlop={12}
        onPress={openProfile}
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
