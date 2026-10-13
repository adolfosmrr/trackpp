import { DarkTheme, type Theme } from "@react-navigation/native"

import { colors } from "./tokens"

export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.brand,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    notification: colors.brand,
  },
}
