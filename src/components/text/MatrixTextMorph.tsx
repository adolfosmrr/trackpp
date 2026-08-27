import { useEffect, useRef, useState } from "react"
import { Text, type StyleProp, type TextStyle } from "react-native"

type MatrixTextMorphProps = {
  text: string
  style?: StyleProp<TextStyle>
  stepDuration?: number
}

function getNextText(current: string, target: string) {
  const currentCharacters = Array.from(current)
  const targetCharacters = Array.from(target)
  const sharedLength = Math.min(currentCharacters.length, targetCharacters.length)
  const firstDifference = currentCharacters.findIndex(
    (character, index) => index < sharedLength && character !== targetCharacters[index]
  )

  if (targetCharacters.length < currentCharacters.length) {
    if (firstDifference >= 0 && firstDifference < currentCharacters.length - 1) {
      currentCharacters[firstDifference] = targetCharacters[firstDifference]
    }
    currentCharacters.pop()
    return currentCharacters.join("")
  }

  if (firstDifference >= 0) {
    currentCharacters[firstDifference] = targetCharacters[firstDifference]
  } else if (currentCharacters.length < targetCharacters.length) {
    currentCharacters.push(targetCharacters[currentCharacters.length])
  }

  return currentCharacters.join("")
}

export function MatrixTextMorph({
  text,
  style,
  stepDuration = 30,
}: MatrixTextMorphProps) {
  const [displayText, setDisplayText] = useState(text)
  const displayTextRef = useRef(text)
  const targetTextRef = useRef(text)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    targetTextRef.current = text

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (displayTextRef.current === text) {
      return
    }

    const step = () => {
      const current = displayTextRef.current
      const target = targetTextRef.current

      if (current === target) {
        timeoutRef.current = null
        return
      }

      const next = getNextText(current, target)
      displayTextRef.current = next
      setDisplayText(next)

      if (next !== targetTextRef.current) {
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
  }, [stepDuration, text])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return <Text style={style}>{displayText}</Text>
}
