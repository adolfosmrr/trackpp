import { Text, type StyleProp, type TextProps, type TextStyle } from "react-native"

import { colors, typography } from "../../theme"

type AppTextVariant = keyof typeof typography
type AppTextTone = "default" | "muted" | "brand" | "destructive" | "onBrand"

type AppTextProps = TextProps & {
  variant?: AppTextVariant
  tone?: AppTextTone
  style?: StyleProp<TextStyle>
}

const toneColor: Record<AppTextTone, TextStyle> = {
  default: { color: colors.foreground },
  muted: { color: colors.mutedForeground },
  brand: { color: colors.brand },
  destructive: { color: colors.destructive },
  onBrand: { color: colors.brandForeground },
}

export function AppText({
  variant = "body",
  tone = "default",
  style,
  ...rest
}: AppTextProps) {
  return <Text style={[typography[variant], toneColor[tone], style]} {...rest} />
}
