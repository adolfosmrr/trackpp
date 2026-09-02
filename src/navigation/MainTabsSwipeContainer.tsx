import {
  useNavigation,
  useNavigationState,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { runOnJS, useSharedValue } from "react-native-reanimated"
import { StyleSheet, View } from "react-native"
import { createElement } from "react"
import type { ComponentType, ReactNode } from "react"

export type MainTabsParamList = {
  Home: undefined
  Transactions: undefined
  AiChat: undefined
  Budgets: undefined
  Profile: undefined
}

export const TAB_ORDER = [
  "Home",
  "Transactions",
  "AiChat",
  "Budgets",
  "Profile",
] as const

const GESTURE_ACTIVATION_DISTANCE = 40
const SWIPE_DISTANCE = 80
const SWIPE_VELOCITY = 700
const HORIZONTAL_INTENT_RATIO = 1.35
const VERTICAL_FAIL_DISTANCE = 28

export function MainTabsSwipeContainer({ children }: { children: ReactNode }) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const activeIndex = useNavigationState((state) => state.index)
  const committed = useSharedValue(false)

  function navigateBySwipe(translationX: number, translationY: number, velocityX: number) {
    if (committed.value) return

    const horizontalDistance = Math.abs(translationX)
    const verticalDistance = Math.abs(translationY)
    const isClearlyHorizontal = horizontalDistance >= verticalDistance * HORIZONTAL_INTENT_RATIO
    const hasEnoughIntent = horizontalDistance >= SWIPE_DISTANCE || Math.abs(velocityX) >= SWIPE_VELOCITY

    if (!isClearlyHorizontal || !hasEnoughIntent) return

    const nextIndex = translationX < 0 ? activeIndex + 1 : activeIndex - 1
    const nextRoute = TAB_ORDER[nextIndex]

    if (!nextRoute) return

    committed.value = true
    navigation.navigate(nextRoute)
  }

  const gesture = Gesture.Pan()
    .activeOffsetX([-GESTURE_ACTIVATION_DISTANCE, GESTURE_ACTIVATION_DISTANCE])
    .failOffsetY([-VERTICAL_FAIL_DISTANCE, VERTICAL_FAIL_DISTANCE])
    .onBegin(() => {
      committed.value = false
    })
    .onEnd((event) => {
      runOnJS(navigateBySwipe)(
        event.translationX,
        event.translationY,
        event.velocityX,
      )
    })

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  )
}

export function withMainTabsSwipe(Component: ComponentType<any>) {
  return function MainTabsSwipeScreen(props: any) {
    return (
      <MainTabsSwipeContainer>
        {createElement(Component, props)}
      </MainTabsSwipeContainer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
