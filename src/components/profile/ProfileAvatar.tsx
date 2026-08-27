import { Image, StyleSheet, Text, View } from "react-native"

type ProfileAvatarProps = {
  name?: string | null
  uri?: string | null
}

export function ProfileAvatar({ name, uri }: ProfileAvatarProps) {
  const initials = name?.trim()
    ? name.trim().slice(0, 1).toUpperCase()
    : "?"

  return uri ? (
    <Image accessibilityLabel="Avatar del perfil" source={{ uri }} style={styles.avatar} />
  ) : (
    <View accessibilityLabel="Avatar del perfil" style={styles.avatar}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: "#D1D1D1",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  initials: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
  },
})
