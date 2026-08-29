import { ReactNode, useLayoutEffect, useRef, useState } from "react"
import { LayoutChangeEvent, StyleSheet, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

type StackedCardListProps<T> = {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  expanded: boolean
  collapsedOffset?: number
  expandedGap?: number
  reduceMotionEnabled?: boolean
}

export function StackedCardList<T>({
  items,
  renderItem,
  expanded,
  collapsedOffset = 15,
  expandedGap = 10,
  reduceMotionEnabled = false,
}: StackedCardListProps<T>) {
  const [itemHeights, setItemHeights] = useState<Record<number, number>>({})
  const containerHeight = useSharedValue(0)
  const initialized = useRef(false)
  const hasMeasurements = items.length > 0 && items.every((_, index) => itemHeights[index] !== undefined)
  const measuredHeight = Math.max(...items.map((_, index) => itemHeights[index] ?? 0), 0)
  const collapsedHeight = measuredHeight + collapsedOffset * Math.max(items.length - 1, 0)
  const expandedHeight = items.reduce(
    (total, _, index) => total + (itemHeights[index] ?? 0),
    expandedGap * Math.max(items.length - 1, 0)
  )
  const expandedPositions = items.map((_, index) =>
    items.slice(0, index).reduce(
      (total, __, previousIndex) => total + (itemHeights[previousIndex] ?? 0),
      expandedGap * index
    )
  )
  const containerTargetHeight = expanded ? expandedHeight : collapsedHeight

  useLayoutEffect(() => {
    if (!hasMeasurements) return

    if (!initialized.current) {
      containerHeight.value = containerTargetHeight
      initialized.current = true
      return
    }

    containerHeight.value = reduceMotionEnabled
      ? containerTargetHeight
      : withSpring(containerTargetHeight, {
          stiffness: 280,
          damping: 24,
          mass: 0.9,
        })
  }, [containerTargetHeight, hasMeasurements, reduceMotionEnabled])

  const handleLayout = (index: number) => (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height
    setItemHeights((current) => (
      current[index] === height ? current : { ...current, [index]: height }
    ))
  }

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: containerHeight.value,
  }))

  return (
    <Animated.View
      style={[
        styles.container,
        animatedContainerStyle,
      ]}
    >
      {items.map((item, index) => (
        <StackedCardItem
          key={index}
          onLayout={handleLayout(index)}
          ready={hasMeasurements}
          reduceMotionEnabled={reduceMotionEnabled}
          targetY={expanded ? expandedPositions[index] : index * collapsedOffset}
          zIndex={items.length - index}
        >
          {renderItem(item, index)}
        </StackedCardItem>
      ))}
    </Animated.View>
  )
}

function StackedCardItem({
  children,
  onLayout,
  ready,
  reduceMotionEnabled,
  targetY,
  zIndex,
}: {
  children: ReactNode
  onLayout: (event: LayoutChangeEvent) => void
  ready: boolean
  reduceMotionEnabled: boolean
  targetY: number
  zIndex: number
}) {
  const translateY = useSharedValue(0)
  const initialized = useRef(false)

  useLayoutEffect(() => {
    if (!ready) {
      initialized.current = false
      return
    }

    if (!initialized.current) {
      translateY.value = targetY
      initialized.current = true
      return
    }

    translateY.value = reduceMotionEnabled
      ? targetY
      : withSpring(targetY, {
          stiffness: 260,
          damping: 18,
          mass: 0.8,
          overshootClamping: false,
        })
  }, [ready, reduceMotionEnabled, targetY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: ready ? 1 : 0,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View
      onLayout={onLayout}
      style={[styles.item, { zIndex }, animatedStyle]}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
  },
  item: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
  },
})
