import { StyleSheet, View } from "react-native"
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated"

type HomeGreetingProps = {
  displayName?: string
  collapseProgress: SharedValue<number>
}

export function HomeGreeting({ displayName, collapseProgress }: HomeGreetingProps) {
  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(collapseProgress.value, [0, 1], [78, 20]),
    marginTop: 20,
  }))
  const verticalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.75, 1], [1, 0, 0]),
    transform: [{ translateY: interpolate(collapseProgress.value, [0, 1], [0, -10]) }],
  }))
  const horizontalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.25, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(collapseProgress.value, [0, 1], [10, 0]) }],
  }))

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.layout, verticalStyle]}>
        <Animated.Text style={styles.helloText}>Hola</Animated.Text>
        {displayName ? <Animated.Text style={styles.nameText}>{displayName}</Animated.Text> : null}
      </Animated.View>
      <Animated.View style={[styles.horizontalLayout, horizontalStyle]}>
        <Animated.Text style={styles.collapsedHelloText}>Hola</Animated.Text>
        {displayName ? <Animated.Text style={styles.collapsedNameText}>{displayName}</Animated.Text> : null}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    position: "relative",
  },
  layout: {
    left: 0,
    position: "absolute",
    top: 0,
  },
  horizontalLayout: {
    alignItems: "center",
    flexDirection: "row",
    left: 0,
    position: "absolute",
    top: 0,
  },
  helloText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 30,
    lineHeight: 34,
    opacity: 0.5,
  },
  nameText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 40,
    lineHeight: 44,
  },
  collapsedHelloText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 20,
    lineHeight: 20,
    opacity: 0.5,
  },
  collapsedNameText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 20,
    lineHeight: 20,
    marginLeft: 8,
  },
})
