import { Pressable, StyleSheet, View } from "react-native"
import { useNavigation } from "@react-navigation/native"

import { PlusIcon } from "../icons/PlusIcon"
import { ProfileAvatar } from "../profile/ProfileAvatar"
import type { Profile } from "../../features/profile/services/profileService"
import { HouseholdSwitcher } from "../../features/households/components/HouseholdSwitcher"

type TopSectionHeaderProps = {
  profile?: Pick<Profile, "name" | "avatar_url"> | null
}

export function TopSectionHeader({ profile }: TopSectionHeaderProps) {
  const navigation = useNavigation<any>()

  return (
    <View style={styles.row}>
      <ProfileAvatar name={profile?.name} uri={profile?.avatar_url} />
      <HouseholdSwitcher compact />
      <Pressable
        accessibilityLabel="Agregar movimiento"
        accessibilityRole="button"
        onPress={() => navigation.navigate("CreateTransaction")}
        style={styles.addButton}
      >
        <PlusIcon />
      </Pressable>
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
    backgroundColor: "#1C1C1C",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginLeft: "auto",
    width: 40,
  },
})
