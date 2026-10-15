import { Easing } from "react-native-reanimated"

const stagger = 100
const fade = 240

export const authTabMotion = {
  stagger,
  fade,
  layout: fade + stagger * 2,
  slide: 36,
  labelStep: 30,
  exitEasing: Easing.out(Easing.cubic),
  enterEasing: Easing.in(Easing.cubic),
} as const
