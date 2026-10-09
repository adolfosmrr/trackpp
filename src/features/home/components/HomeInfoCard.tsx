import MaskedView from "@react-native-masked-view/masked-view"
import {
  LinearGradient,
  Rect,
  Stop,
  Svg,
} from "react-native-svg"
import {
  StyleSheet,
  Text,
  View,
} from "react-native"

import { colors, fonts, radii } from "../../../theme"

export type HomeInfoCardVariant = "darkGradientText" | "light" | "gradient" | "dark"

type HomeInfoCardProps = {
  icon?: string | null
  message: string
  variant: HomeInfoCardVariant
}

const CARD_GRADIENT = [colors.brandMuted, colors.brandDeep]
const TEXT_GRADIENT = [colors.brandBright, colors.brand]

export function HomeInfoCard({
  icon,
  message,
  variant,
}: HomeInfoCardProps) {
  const isDarkText = variant === "darkGradientText"

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.cardSurface,
          variant === "darkGradientText" && styles.darkCard,
          variant === "dark" && styles.plainDarkCard,
          variant === "light" && styles.lightCard,
        ]}
      >
        {variant === "gradient" ? (
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <LinearGradient id="home-info-card-gradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={CARD_GRADIENT[0]} />
              <Stop offset="1" stopColor={CARD_GRADIENT[1]} />
            </LinearGradient>
            <Rect width="100%" height="100%" fill="url(#home-info-card-gradient)" />
          </Svg>
        ) : null}

        <View style={styles.content}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          {isDarkText ? (
            <View style={styles.gradientTextWrapper}>
              <Text
                style={[styles.message, styles.gradientTextMeasure]}
                pointerEvents="none"
              >
                {message}
              </Text>
              <MaskedView
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
                maskElement={
                  <Text style={[styles.message, styles.maskText]}>
                    {message}
                  </Text>
                }
              >
                <Svg
                  style={StyleSheet.absoluteFill}
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                >
                  <LinearGradient
                    id="home-info-text-gradient"
                    x1="0%"
                    y1="100%"
                    x2="100%"
                    y2="0%"
                  >
                    <Stop offset="0" stopColor={TEXT_GRADIENT[0]} />
                    <Stop offset="1" stopColor={TEXT_GRADIENT[1]} />
                  </LinearGradient>
                  <Rect width="100%" height="100%" fill="url(#home-info-text-gradient)" />
                </Svg>
              </MaskedView>
            </View>
          ) : (
            <Text
              style={[
                styles.message,
                variant === "gradient"
                  ? styles.gradientMessage
                  : variant === "dark"
                    ? styles.darkMessage
                    : styles.lightMessage,
              ]}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: radii.md,
  },
  cardSurface: {
    width: "100%",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  darkCard: {
    backgroundColor: colors.card,
  },
  plainDarkCard: {
    backgroundColor: colors.backgroundElevated,
  },
  lightCard: {
    backgroundColor: colors.popover,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  icon: {
    fontSize: 22,
    lineHeight: 27,
  },
  gradientTextWrapper: {
    flex: 1,
    minWidth: 0,
    position: "relative",
  },
  message: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: fonts.sansMedium,
  },
  maskText: {
    color: colors.foreground,
  },
  gradientTextMeasure: {
    opacity: 0,
  },
  gradientMessage: {
    color: colors.foreground,
  },
  lightMessage: {
    color: colors.foreground,
  },
  darkMessage: {
    color: colors.foreground,
  },
})
