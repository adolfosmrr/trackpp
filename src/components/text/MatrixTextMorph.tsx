import { useEffect, useRef, useState } from "react"
import { Text, type StyleProp, type TextStyle } from "react-native"
import { useReducedMotion } from "react-native-reanimated"

type MatrixTextMorphProps = {
  text: string
  style?: StyleProp<TextStyle>
  stepDuration?: number
}

function stepToward(current: string, target: string) {
  const currentCharacters = Array.from(current)
  const targetCharacters = Array.from(target)

  if (currentCharacters.length > targetCharacters.length) {
    currentCharacters.pop()
    return currentCharacters.join("")
  }

  const firstDifference = currentCharacters.findIndex(
    (character, index) => character !== targetCharacters[index],
  )
  const replacement = targetCharacters[firstDifference]
  if (firstDifference >= 0 && replacement !== undefined) {
    currentCharacters[firstDifference] = replacement
    return currentCharacters.join("")
  }

  const appended = targetCharacters[currentCharacters.length]
  if (appended !== undefined) {
    currentCharacters.push(appended)
  }

  return currentCharacters.join("")
}

function buildMorphFrames(from: string, to: string) {
  const frames = [from]
  let current = from
  const limit = Array.from(from).length + Array.from(to).length

  while (current !== to && frames.length <= limit) {
    const next = stepToward(current, to)
    if (next === current) break
    current = next
    frames.push(current)
  }

  if (frames[frames.length - 1] !== to) {
    frames.push(to)
  }

  return frames
}

export function MatrixTextMorph({
  text,
  style,
  stepDuration = 30,
}: MatrixTextMorphProps) {
  const reducedMotion = useReducedMotion() === true
  const [displayText, setDisplayText] = useState(text)
  const displayTextRef = useRef(text)
  const framesRef = useRef<string[]>([text])
  const indexRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (reducedMotion) {
      displayTextRef.current = text
      framesRef.current = [text]
      indexRef.current = 0
      setDisplayText(text)
      return
    }

    if (displayTextRef.current === text) {
      return
    }

    const showing = displayTextRef.current
    let path = framesRef.current
    const onPath = text === path[0] || text === path[path.length - 1]
    const at = onPath ? path.indexOf(showing) : -1
    if (!onPath || at < 0) {
      path = buildMorphFrames(showing, text)
      framesRef.current = path
      indexRef.current = 0
    } else {
      indexRef.current = at
    }

    const targetIndex = text === path[path.length - 1] ? path.length - 1 : 0
    if (indexRef.current === targetIndex) {
      displayTextRef.current = text
      setDisplayText(text)
      return
    }

    const direction = targetIndex > indexRef.current ? 1 : -1

    const step = () => {
      const nextIndex = indexRef.current + direction
      const next = path[nextIndex]
      if (next === undefined) {
        timeoutRef.current = null
        return
      }

      indexRef.current = nextIndex
      displayTextRef.current = next
      setDisplayText(next)

      if (nextIndex !== targetIndex) {
        timeoutRef.current = setTimeout(step, Math.max(0, stepDuration))
      } else {
        timeoutRef.current = null
      }
    }

    timeoutRef.current = setTimeout(step, Math.max(0, stepDuration))

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [reducedMotion, stepDuration, text])

  return <Text style={style}>{displayText}</Text>
}
