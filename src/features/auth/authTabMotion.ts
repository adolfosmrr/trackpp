const stagger = 100
const fade = 240

export const authTabMotion = {
  stagger,
  fade,
  layout: fade + stagger * 2,
  slide: 36,
  labelStep: 30,
} as const
