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

export type HomeInfoCardVariant = "darkGradientText" | "light" | "gradient" | "dark"

type HomeInfoCardProps = {
  icon?: string | null
  message: string
  variant: HomeInfoCardVariant
}

const CARD_GRADIENT = ["#BFFFC7", "#18A5A7"]
const TEXT_GRADIENT = ["#BFFFC7", "#18A5A7"]

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
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardSurface: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  darkCard: {
    backgroundColor: "#111",
  },
  plainDarkCard: {
    backgroundColor: "#000000",
  },
  lightCard: {
    backgroundColor: "#EEEEEE",
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
    fontFamily: "FamiljenGrotesk-Bold",
  },
  maskText: {
    color: "#000",
  },
  gradientTextMeasure: {
    opacity: 0,
  },
  gradientMessage: {
    color: "#1C1C1C",
  },
  lightMessage: {
    color: "#1C1C1C",
  },
  darkMessage: {
    color: "#FFFFFF",
  },
})
