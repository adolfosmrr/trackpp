import { useEffect, useRef, useState } from "react"
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"

export type AuthMode = "login" | "register"

type AuthToggleProps = {
  value: AuthMode
  onChange: (value: AuthMode) => void
}

export function AuthToggle({ value, onChange }: AuthToggleProps) {
  const [containerWidth, setContainerWidth] = useState(0)
  const translateX = useSharedValue(0)
  const previousValue = useRef(value)
  const optionWidth = Math.max(0, containerWidth - 8) / 2

  useEffect(() => {
    if (containerWidth === 0) {
      return
    }

    const nextTranslateX = value === "register" ? optionWidth : 0

    if (previousValue.current === value) {
      translateX.value = nextTranslateX
    } else {
      const overshoot =
        nextTranslateX + (value === "register" ? optionWidth * 0.03 : -optionWidth * 0.03)

      translateX.value = withSequence(
        withTiming(overshoot, {
          duration: 320,
          easing: Easing.inOut(Easing.cubic),
        }),
        withSpring(nextTranslateX, {
          damping: 18,
          stiffness: 500,
          mass: 1.6,
        })
      )
      previousValue.current = value
    }
  }, [containerWidth, optionWidth, translateX, value])

  function handleLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width)
  }

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    width: optionWidth,
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Animated.View
        pointerEvents="none"
        style={[styles.indicator, animatedIndicatorStyle]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: value === "login" }}
        onPress={() => onChange("login")}
        style={styles.option}
      >
        <Text
          style={[
            styles.text,
            value === "login" ? styles.selectedText : styles.unselectedText,
          ]}
        >
          Iniciar sesión
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: value === "register" }}
        onPress={() => onChange("register")}
        style={styles.option}
      >
        <Text
          style={[
            styles.text,
            value === "register" ? styles.selectedText : styles.unselectedText,
          ]}
        >
          Registrarse
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    flexDirection: "row",
    padding: 4,
    borderRadius: 100,
    backgroundColor: "#F3F3F3",
  },
  indicator: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 50,
    backgroundColor: "#1C1C1C",
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    zIndex: 1,
  },
  text: {
    fontFamily: "FamiljenGrotesk-Medium",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  unselectedText: {
    color: "#1C1C1C",
  },
})
