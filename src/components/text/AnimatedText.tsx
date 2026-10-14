import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native"
import { memo, useEffect, useRef, useState } from "react"
import Animated, {
  Easing,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated"

type AnimationParams = {
  opacity: number
  translateY: number
  scale: number
  rotate: number
}

type AnimationConfig = {
  spring: {
    damping: number
    stiffness: number
    mass: number
  }
  characterDelay: number
  characterEnterDuration: number
}

type AnimatedTextProps = {
  text: string
  style?: StyleProp<TextStyle>
  animationConfig?: Partial<AnimationConfig> & {
    spring?: Partial<AnimationConfig["spring"]>
  }
  enterFrom?: Partial<AnimationParams>
  enterTo?: Partial<AnimationParams>
  exitFrom?: Partial<AnimationParams>
  exitTo?: Partial<AnimationParams>
}

const DEFAULT_CONFIG: AnimationConfig = {
  spring: { damping: 15, stiffness: 210, mass: 1 },
  characterDelay: 15,
  characterEnterDuration: 360,
}

const DEFAULT_ENTER_FROM: AnimationParams = {
  opacity: 0,
  translateY: 18,
  scale: 0.8,
  rotate: 0,
}

const DEFAULT_ENTER_TO: AnimationParams = {
  opacity: 1,
  translateY: 0,
  scale: 1,
  rotate: 0,
}

const DEFAULT_EXIT_FROM: AnimationParams = {
  opacity: 1,
  translateY: 0,
  scale: 1,
  rotate: 0,
}

const DEFAULT_EXIT_TO: AnimationParams = {
  opacity: 0,
  translateY: -10,
  scale: 0.96,
  rotate: 0,
}

type CharacterProps = {
  char: string
  index: number
  style?: StyleProp<TextStyle>
  animationConfig: AnimationConfig
  enterFrom: AnimationParams
  enterTo: AnimationParams
  exitFrom: AnimationParams
  exitTo: AnimationParams
  shouldAnimate: boolean
}

const Character = memo(function Character({
  char,
  index,
  style,
  animationConfig,
  enterFrom,
  enterTo,
  exitFrom,
  exitTo,
  shouldAnimate,
}: CharacterProps) {
  const characterDelay = index * animationConfig.characterDelay

  const entering = () => {
    "worklet"

    const timingConfig = {
      duration: animationConfig.characterEnterDuration,
      easing: Easing.out(Easing.ease),
    }

    return {
      initialValues: {
        opacity: enterFrom.opacity,
        transform: [
          { translateY: enterFrom.translateY },
          { scale: enterFrom.scale },
          { rotate: `${enterFrom.rotate}deg` },
        ],
      },
      animations: {
        opacity: withDelay(characterDelay, withTiming(enterTo.opacity, timingConfig)),
        transform: [
          {
            translateY: withDelay(
              characterDelay,
              withSpring(enterTo.translateY, animationConfig.spring)
            ),
          },
          {
            scale: withDelay(
              characterDelay,
              withSpring(enterTo.scale, animationConfig.spring)
            ),
          },
          {
            rotate: withDelay(
              characterDelay,
              withSpring(`${enterTo.rotate}deg`, animationConfig.spring)
            ),
          },
        ],
      },
    }
  }

  const exiting = () => {
    "worklet"

    const timingConfig = {
      duration: animationConfig.characterEnterDuration,
      easing: Easing.in(Easing.ease),
    }

    return {
      initialValues: {
        opacity: exitFrom.opacity,
        transform: [
          { translateY: exitFrom.translateY },
          { scale: exitFrom.scale },
          { rotate: `${exitFrom.rotate}deg` },
        ],
      },
      animations: {
        opacity: withDelay(characterDelay, withTiming(exitTo.opacity, timingConfig)),
        transform: [
          {
            translateY: withDelay(
              characterDelay,
              withSpring(exitTo.translateY, animationConfig.spring)
            ),
          },
          {
            scale: withDelay(
              characterDelay,
              withSpring(exitTo.scale, animationConfig.spring)
            ),
          },
          {
            rotate: withDelay(
              characterDelay,
              withSpring(`${exitTo.rotate}deg`, animationConfig.spring)
            ),
          },
        ],
      },
    }
  }

  return (
    <Animated.View
      entering={shouldAnimate ? entering : undefined}
      exiting={shouldAnimate ? exiting : undefined}
      style={styles.characterWrapper}
    >
      <Animated.Text style={style}>{char}</Animated.Text>
    </Animated.View>
  )
})

export const AnimatedText = memo(function AnimatedText({
  text,
  style,
  animationConfig,
  enterFrom,
  enterTo,
  exitFrom,
  exitTo,
}: AnimatedTextProps) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)
  const hasMounted = useRef(false)

  useEffect(() => {
    let mounted = true

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotionEnabled(enabled)
      }
    })

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled
    )

    hasMounted.current = true

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  const config: AnimationConfig = {
    ...DEFAULT_CONFIG,
    ...animationConfig,
    spring: {
      ...DEFAULT_CONFIG.spring,
      ...animationConfig?.spring,
    },
  }

  const mergedEnterFrom = { ...DEFAULT_ENTER_FROM, ...enterFrom }
  const mergedEnterTo = { ...DEFAULT_ENTER_TO, ...enterTo }
  const mergedExitFrom = { ...DEFAULT_EXIT_FROM, ...exitFrom }
  const mergedExitTo = { ...DEFAULT_EXIT_TO, ...exitTo }
  const shouldAnimate = hasMounted.current && !reduceMotionEnabled
  const lines = text.split("\n")
  let globalCharacterIndex = 0

  return (
    <View style={styles.textWrapper}>
      {lines.map((line, lineIndex) => {
        const words = line.trim().split(/\s+/).filter((word) => word.length > 0)

        return (
          <View key={`${text}-line-${lineIndex}`} style={styles.lineWrapper}>
            {words.map((word, wordIndex) => {
              const wordCharacters = Array.from(word)
              const wordStartIndex = globalCharacterIndex
              globalCharacterIndex += wordCharacters.length

              return (
                <View
                  key={`${text}-word-${lineIndex}-${wordIndex}`}
                  style={[
                    styles.wordWrapper,
                    wordIndex < words.length - 1 && styles.wordSpacing,
                  ]}
                >
                  {wordCharacters.map((char, characterIndex) => (
                    <Character
                      key={`${text}-${wordStartIndex + characterIndex}`}
                      char={char}
                      index={wordStartIndex + characterIndex}
                      style={style}
                      animationConfig={config}
                      enterFrom={mergedEnterFrom}
                      enterTo={mergedEnterTo}
                      exitFrom={mergedExitFrom}
                      exitTo={mergedExitTo}
                      shouldAnimate={shouldAnimate}
                    />
                  ))}
                </View>
              )
            })}
          </View>
        )
      })}
    </View>
  )
})

const styles = StyleSheet.create({
  textWrapper: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
  },
  lineWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "100%",
  },
  wordWrapper: {
    flexDirection: "row",
    flexWrap: "nowrap",
    flexShrink: 0,
  },
  wordSpacing: {
    marginRight: 5,
  },
  characterWrapper: {
    position: "relative",
  },
})

export default AnimatedText
