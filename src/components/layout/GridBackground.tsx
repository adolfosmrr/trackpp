import { useMemo } from "react"
import {
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native"

type GridBackgroundProps = {
  spacing?: number
  lineColor?: string
  lineWidth?: number
  opacity?: number
}

export function GridBackground({
  spacing = 15,
  lineColor = "#000",
  lineWidth = 0.3,
  opacity = 0.1,
}: GridBackgroundProps) {
  const { width, height } = useWindowDimensions()
  const safeSpacing = Math.max(1, spacing)

  const { horizontalLines, verticalLines } = useMemo(() => {
    return {
      verticalLines: Array.from(
        { length: Math.floor(width / safeSpacing) + 1 },
        (_, index) => index * safeSpacing
      ),
      horizontalLines: Array.from(
        { length: Math.floor(height / safeSpacing) + 1 },
        (_, index) => index * safeSpacing
      ),
    }
  }, [height, safeSpacing, width])

  return (
    <View pointerEvents="none" style={styles.container}>
      {verticalLines.map((left) => (
        <View
          key={`vertical-${left}`}
          style={[
            styles.verticalLine,
            { left, backgroundColor: lineColor, width: lineWidth, opacity },
          ]}
        />
      ))}
      {horizontalLines.map((top) => (
        <View
          key={`horizontal-${top}`}
          style={[
            styles.horizontalLine,
            { top, backgroundColor: lineColor, height: lineWidth, opacity },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  verticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  horizontalLine: {
    position: "absolute",
    left: 0,
    right: 0,
  },
})
