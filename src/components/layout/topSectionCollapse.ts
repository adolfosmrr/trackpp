import { cancelAnimation, withSpring, type SharedValue } from "react-native-reanimated"

/**
 * Vertical layout endpoints for the home top panel, expanded then collapsed.
 * The spacer uses the same deltas, so the list follows the panel 1:1.
 */
export const TOP_HEADER_HEIGHT = [40, 24] as const
export const TOP_AVATAR_SIZE = [40, 24] as const
export const TOP_GREETING_HEIGHT = [78, 20] as const
export const TOP_BALANCE_MARGIN_TOP = [60, 20] as const
export const TOP_BALANCE_LABEL_HEIGHT = [22, 0] as const
export const TOP_BALANCE_AMOUNT_HEIGHT = [66, 46] as const
export const TOP_BALANCE_FONT_SIZE = [60, 40] as const
export const TOP_SUMMARY_MARGIN_TOP = [50, 10] as const
export const TOP_SUMMARY_MARGIN_BOTTOM = [10, 30] as const
export const TOP_SUMMARY_LABEL_FONT_SIZE = [18, 16] as const
export const TOP_INSIGHT_MARGIN_TOP = [30, 0] as const
export const TOP_INSIGHT_HEIGHT = [112, 0] as const
export const TOP_INSIGHT_MARGIN_BOTTOM = [60, 0] as const

const span = ([expanded, collapsed]: readonly [number, number]) => expanded - collapsed

const TOP_SECTION_BODY_COLLAPSE =
  span(TOP_HEADER_HEIGHT) +
  span(TOP_GREETING_HEIGHT) +
  span(TOP_BALANCE_MARGIN_TOP) +
  span(TOP_BALANCE_LABEL_HEIGHT) +
  span(TOP_BALANCE_AMOUNT_HEIGHT) +
  span(TOP_SUMMARY_MARGIN_TOP) +
  span(TOP_SUMMARY_MARGIN_BOTTOM)

export const TOP_SECTION_INSIGHT_COLLAPSE =
  span(TOP_INSIGHT_MARGIN_TOP) +
  span(TOP_INSIGHT_HEIGHT) +
  span(TOP_INSIGHT_MARGIN_BOTTOM)

export function topSectionCollapseRange(showsInsight: boolean) {
  return TOP_SECTION_BODY_COLLAPSE + (showsInsight ? TOP_SECTION_INSIGHT_COLLAPSE : 0)
}

const TOP_SECTION_SPRING = {
  damping: 22,
  stiffness: 240,
  mass: 0.7,
  overshootClamping: true,
} as const

const TOP_SECTION_FLICK_VELOCITY = 300
const TOP_SECTION_SNAP_PROGRESS = 0.35

export function topSectionSnapTarget(progress: number, velocityY: number) {
  "worklet"
  if (velocityY < -TOP_SECTION_FLICK_VELOCITY) return 1
  if (velocityY > TOP_SECTION_FLICK_VELOCITY) return 0
  return progress >= TOP_SECTION_SNAP_PROGRESS ? 1 : 0
}

export function settleTopSectionProgress(
  progress: SharedValue<number>,
  range: SharedValue<number>,
  reduceMotion: SharedValue<boolean>,
  settling: SharedValue<boolean>,
  acceptLayout: SharedValue<boolean>,
  target: number,
  velocityY = 0,
) {
  "worklet"
  const distance = Math.max(1, range.value)
  cancelAnimation(progress)
  acceptLayout.value = false
  if (reduceMotion.value) {
    progress.value = target
    settling.value = false
    acceptLayout.value = target === 0
    return
  }
  settling.value = true
  progress.value = withSpring(
    target,
    {
      ...TOP_SECTION_SPRING,
      velocity: -velocityY / distance,
    },
    (finished) => {
      if (!finished) return
      settling.value = false
      if (target === 0) acceptLayout.value = true
    },
  )
}
