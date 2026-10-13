import { StyleSheet, type StyleProp, type ViewStyle } from "react-native"
import { AppText } from "../text/AppText"
import { colors } from "../../theme"
import Animated from "react-native-reanimated"

type ProfileAvatarProps = {
  name?: string | null
  uri?: string | null
  variant?: "title" | "subtitle"
  style?: StyleProp<Pick<ViewStyle, "borderRadius" | "height" | "marginBottom" | "width">>
}

export function ProfileAvatar({ name, uri, variant = "subtitle", style }: ProfileAvatarProps) {
  const label = initials(name)

  return uri ? (
    <Animated.Image accessibilityLabel="Avatar del perfil" source={{ uri }} style={[styles.avatar, style]} />
  ) : (
    <Animated.View accessibilityLabel="Avatar del perfil" style={[styles.avatar, style]}>
      <AppText variant={variant}>{label}</AppText>
    </Animated.View>
  )
}

function initials(name: string | null | undefined) {
  if (!name?.trim()) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
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
    overflow: "hidden",
    width: 40,
  },
})
