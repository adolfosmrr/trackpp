import { StyleSheet, Text, type ViewStyle } from "react-native"
import Animated, { type AnimatedStyle } from "react-native-reanimated"

type ProfileAvatarProps = {
  name?: string | null
  uri?: string | null
  style?: AnimatedStyle<Pick<ViewStyle, "borderRadius" | "height" | "width">>
}

export function ProfileAvatar({ name, uri, style }: ProfileAvatarProps) {
  const initials = name?.trim()
    ? name.trim().slice(0, 1).toUpperCase()
    : "?"

  return uri ? (
    <Animated.Image accessibilityLabel="Avatar del perfil" source={{ uri }} style={[styles.avatar, style]} />
  ) : (
    <Animated.View accessibilityLabel="Avatar del perfil" style={[styles.avatar, style]}>
      <Text style={styles.initials}>{initials}</Text>
    </Animated.View>
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
