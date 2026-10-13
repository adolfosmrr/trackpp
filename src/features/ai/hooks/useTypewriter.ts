import { useEffect, useRef, useState } from "react"
import { AccessibilityInfo } from "react-native"

const WORD_INTERVAL_MS = 40

export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    let mounted = true
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled)
    })
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    )
    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  return reduceMotion
}

export function useTypewriter(text: string, active: boolean, onComplete?: () => void) {
  const reduceMotion = useReduceMotion()
  const [shown, setShown] = useState(active ? "" : text)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!active || reduceMotion) {
      setShown(text)
      if (active) onCompleteRef.current?.()
      return
    }

    const tokens = text.match(/\S+\s*/g) ?? []
    if (tokens.length === 0) {
      setShown("")
      onCompleteRef.current?.()
      return
    }

    let count = 0
    setShown("")
    const timer = setInterval(() => {
      count += 1
      setShown(tokens.slice(0, count).join(""))
      if (count >= tokens.length) {
        clearInterval(timer)
        onCompleteRef.current?.()
      }
    }, WORD_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [active, reduceMotion, text])

  return shown
}
