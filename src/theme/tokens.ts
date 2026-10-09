/**
 * Supabase-inspired design tokens.
 *
 * Colors are taken from the open-source Supabase UI theme
 * (packages/ui dark.css + semantic.css, dark appearance):
 * - canvas / surfaces from the OKLCH surface ramp (hue 157.5, L 0.19, chroma 0.005)
 * - brand-default hsl(153.1 60.2% 52.7%) = #3ECF8E for primary actions
 * - destructive-600 / warning anchors for status text that stays AA on the canvas
 *
 * Inter stands in for Supabase's proprietary sans (Circular / custom).
 * Source Code Pro is the mono they list beside Office Code Pro.
 */

export const colors = {
  background: "#131413",
  backgroundElevated: "#181A19",
  card: "#1B1D1C",
  popover: "#1E201F",
  control: "#242625",
  field: "#101210",

  foreground: "#EDEFEE",
  mutedForeground: "#989A99",

  border: "#2A2C2B",
  borderStrong: "#3A3D3B",

  brand: "#3ECF8E",
  brandBright: "#85E0BA",
  brandDeep: "#1F6B49",
  brandMuted: "rgba(62, 207, 142, 0.14)",
  brandBorder: "rgba(62, 207, 142, 0.40)",
  brandForeground: "#0C1210",

  destructive: "#F16A50",
  destructiveMuted: "rgba(241, 106, 80, 0.14)",
  warning: "#F2AF48",

  overlay: "rgba(0, 0, 0, 0.62)",
  gridLine: "rgba(237, 239, 238, 0.08)",
  divider: "rgba(237, 239, 238, 0.12)",

  transparent: "transparent",
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const

export const fonts = {
  sans: "Inter-Regular",
  sansMedium: "Inter-Medium",
  sansSemibold: "Inter-SemiBold",
  sansBold: "Inter-Bold",
  mono: "SourceCodePro-Regular",
  monoMedium: "SourceCodePro-Medium",
  monoSemibold: "SourceCodePro-Semibold",
} as const

export const meshColors = {
  auth: ["#0C1210", "#16382A", "#3ECF8E", "#101614"] as [
    string,
    string,
    string,
    string,
  ],
}

export const refreshControlColors = {
  tintColor: colors.brand,
  colors: [colors.brand],
  progressBackgroundColor: colors.card,
}
