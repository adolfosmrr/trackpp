import { StyleSheet, type ViewStyle } from "react-native"
import { AppText } from "../text/AppText"
import { colors } from "../../theme"
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
      <AppText variant="subtitle">{initials}</AppText>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.control,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
})
