import { useEffect, useState } from "react"
import { AccessibilityInfo } from "react-native"

/** Live reduced-motion setting. Updates if the system preference changes. */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    let mounted = true

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled === true)
    })

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduceMotion(enabled === true),
    )

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  return reduceMotion
}
