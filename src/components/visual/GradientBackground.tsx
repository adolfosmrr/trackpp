import { memo, useEffect, useMemo, useState, type ComponentProps } from "react"
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import {
  Canvas,
  Fill,
  Group,
  notifyChange,
  Shader,
  Skia,
  useClock,
  vec,
} from "@shopify/react-native-skia"
import {
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated"

import { dotOpacity, gradients, type GradientName, type GradientPalette } from "../../theme"

type GradientBackgroundProps = {
  token?: GradientName
  animated?: boolean
  grain?: number
  /** Draw a dot at each former grid intersection. Spacing is in layout points. */
  dotSpacing?: number
  /**
   * Soft moving patches where dots grow and brighten together.
   * The clock runs only while this is on and motion is allowed.
   */
  dotMotion?: boolean
  /** Bottom-only corner radius. The field is clipped to it; content above stays unclipped. */
  bottomRadius?: number
  style?: StyleProp<ViewStyle>
}

type DotField = {
  spacing: number
  radius: number
  color: readonly [number, number, number, number]
}

type FieldProps = {
  palette: GradientPalette
  grainAmount: number
  dots: DotField
  bottomRadius: number
  style?: StyleProp<ViewStyle>
}

const DOT_RADIUS = 1.15
// Same ink as colors.gridLine, a little stronger so a small dot still reads.
const DOT_COLOR: DotField["color"] = [237 / 255, 239 / 255, 238 / 255, 0.2]
const NO_DOTS: DotField = { spacing: 0, radius: 0, color: [0, 0, 0, 0] }

const DRIFT_SPEED = 0.2

const GRADIENT_SHADER = Skia.RuntimeEffect.Make(`
uniform float2 resolution;
uniform float time;
uniform float grain;
uniform float softness;
uniform float4 color0;
uniform float4 color1;
uniform float4 color2;
uniform float4 color3;
uniform float2 point0;
uniform float2 point1;
uniform float2 point2;
uniform float2 point3;
uniform float dotSpacing;
uniform float dotRadius;
uniform float4 dotColor;
uniform float dotTime;
uniform float dotMotion;

float hash(float2 p) {
  float3 p3 = fract(float3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float blob(float2 uv, float2 center, float radius, float aspect) {
  float2 delta = (uv - center) * float2(aspect, 1.0);
  float falloff = length(delta) / max(radius, 0.001);
  return exp(-falloff * falloff * 2.2);
}

float dotEnergy(float2 uv, float aspect) {
  float t = dotTime;
  float2 c0 = float2(
    0.50 + 0.38 * sin(t * 0.62) + 0.08 * sin(t * 0.27 + 1.1),
    0.48 + 0.30 * cos(t * 0.51) + 0.07 * cos(t * 0.22 + 0.6)
  );
  float2 c1 = float2(
    0.46 + 0.36 * cos(t * 0.74 + 2.0) + 0.07 * sin(t * 0.31 + 0.4),
    0.54 + 0.32 * sin(t * 0.58 + 1.3)
  );
  float2 c2 = float2(
    0.55 + 0.34 * sin(t * 0.49 + 3.7),
    0.40 + 0.34 * cos(t * 0.66 + 2.2) + 0.06 * sin(t * 0.24 + 1.8)
  );
  return clamp(
    blob(uv, c0, 0.20, aspect) + blob(uv, c1, 0.17, aspect) + blob(uv, c2, 0.18, aspect),
    0.0,
    1.0
  );
}

float weightAt(float2 uv, float2 center, float aspect) {
  float dx = (uv.x - center.x) * aspect;
  float dy = uv.y - center.y;
  return 1.0 / (dx * dx + dy * dy + softness);
}

float2 drifted(float2 center, float speedX, float speedY, float amplitude) {
  return center + float2(
    amplitude * sin(time * speedX),
    amplitude * sin(time * speedY)
  );
}

half4 main(float2 fragCoord) {
  float2 safeResolution = float2(max(resolution.x, 1.0), max(resolution.y, 1.0));
  float2 uv = fragCoord / safeResolution;
  float aspect = safeResolution.x / safeResolution.y;
  float2 c0 = drifted(point0, 0.15, 0.11, 0.015);
  float2 c1 = drifted(point1, 0.13, 0.17, 0.012);
  float2 c2 = drifted(point2, 0.09, 0.12, 0.01);
  float2 c3 = drifted(point3, 0.11, 0.14, 0.012);
  float w0 = weightAt(uv, c0, aspect);
  float w1 = weightAt(uv, c1, aspect);
  float w2 = weightAt(uv, c2, aspect);
  float w3 = weightAt(uv, c3, aspect);
  float total = w0 + w1 + w2 + w3;
  float3 col = (color0.rgb * w0 + color1.rgb * w1 + color2.rgb * w2 + color3.rgb * w3) / total;
  col += (hash(fragCoord) * 2.0 - 1.0) * grain;
  col = clamp(col, 0.0, 1.0);
  float spacing = max(dotSpacing, 1.0);
  float2 gridLocal = mod(fragCoord, float2(spacing));
  float2 gridDelta = min(gridLocal, float2(spacing) - gridLocal);
  float gridDist = length(gridDelta);
  float inner = max(dotRadius - 0.5, 0.0);
  float outer = dotRadius + 0.45;
  float3 ink = dotColor.rgb;
  float inkAlpha = dotColor.a;
  if (dotMotion > 0.5) {
    // energy 0 keeps the static dot (radius, edge, ink, alpha) computed above.
    // A 0.3x floor made outer coverage smaller than a pixel and swapped in a
    // dark green, so dots between patches vanished. The pulse peak is unchanged.
    float energy = dotEnergy(uv, aspect);
    float pulseRadius = dotRadius * 1.8;
    float pulseEdge = 1.4;
    inner = mix(inner, max(pulseRadius - pulseEdge, 0.0), energy);
    outer = mix(outer, pulseRadius + pulseEdge, energy);
    ink = mix(ink, float3(0.243137, 0.811765, 0.556863), energy);
    inkAlpha = mix(inkAlpha, 1.0, energy);
  }
  float dotMask = (1.0 - smoothstep(inner, outer, gridDist)) * step(0.5, dotSpacing);
  col = mix(col, ink, dotMask * inkAlpha * ${dotOpacity});
  return half4(col, 1.0);
}
`)

function hexToRgba(value: string): [number, number, number, number] {
  const hex = value.replace("#", "")
  const parsed = Number.parseInt(hex, 16)

  if (!Number.isFinite(parsed) || hex.length !== 6) {
    return [0, 0, 0, 1]
  }

  return [
    ((parsed >> 16) & 255) / 255,
    ((parsed >> 8) & 255) / 255,
    (parsed & 255) / 255,
    1,
  ]
}

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    let mounted = true

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled === true)
    })

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduceMotion(enabled === true)
    )

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  return reduceMotion
}

function useFieldSize() {
  const [size, setSize] = useState({ width: 1, height: 1 })

  const onLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.max(1, event.nativeEvent.layout.width)
    const nextHeight = Math.max(1, event.nativeEvent.layout.height)
    setSize((current) =>
      Math.abs(current.width - nextWidth) < 0.5 && Math.abs(current.height - nextHeight) < 0.5
        ? current
        : { width: nextWidth, height: nextHeight }
    )
  }

  return { width: size.width, height: size.height, onLayout }
}

function usePaletteColors(palette: GradientPalette) {
  return useMemo(
    () => palette.colors.map((color) => hexToRgba(color)),
    [palette]
  )
}

function buildUniforms(
  palette: GradientPalette,
  colors: Array<[number, number, number, number]>,
  width: number,
  height: number,
  grainAmount: number,
  dots: DotField,
  time: number,
  dotTime: number,
  dotMotion: number
) {
  "worklet"
  return {
    resolution: vec(width, height),
    time,
    grain: grainAmount,
    softness: palette.softness,
    color0: colors[0],
    color1: colors[1],
    color2: colors[2],
    color3: colors[3],
    point0: vec(palette.points[0][0], palette.points[0][1]),
    point1: vec(palette.points[1][0], palette.points[1][1]),
    point2: vec(palette.points[2][0], palette.points[2][1]),
    point3: vec(palette.points[3][0], palette.points[3][1]),
    dotSpacing: dots.spacing,
    dotRadius: dots.radius,
    dotColor: dots.color,
    dotTime,
    dotMotion,
  }
}

function useBottomClip(width: number, height: number, radius: number) {
  return useMemo(() => {
    if (radius <= 0 || width <= 1 || height <= 1) return null
    const corner = Math.min(radius, width / 2, height / 2)
    return Skia.Path.RRect({
      rect: { x: 0, y: 0, width, height },
      topLeft: vec(0, 0),
      topRight: vec(0, 0),
      bottomRight: vec(corner, corner),
      bottomLeft: vec(corner, corner),
    })
  }, [height, radius, width])
}

function GradientCanvas({
  uniforms,
  onLayout,
  fallbackColor,
  width,
  height,
  bottomRadius,
  style,
}: {
  uniforms: ComponentProps<typeof Shader>["uniforms"]
  onLayout: (event: LayoutChangeEvent) => void
  fallbackColor: string
  width: number
  height: number
  bottomRadius: number
  style?: StyleProp<ViewStyle>
}) {
  const clip = useBottomClip(width, height, bottomRadius)
  const roundedStyle = bottomRadius > 0
    ? {
        borderBottomLeftRadius: bottomRadius,
        borderBottomRightRadius: bottomRadius,
      }
    : null

  if (!GRADIENT_SHADER) {
    return (
      <View
        pointerEvents="none"
        style={[styles.fill, roundedStyle, style, { backgroundColor: fallbackColor }]}
      />
    )
  }

  const field = (
    <Fill>
      <Shader source={GRADIENT_SHADER} uniforms={uniforms} />
    </Fill>
  )

  return (
    <View pointerEvents="none" onLayout={onLayout} style={[styles.fill, roundedStyle, style]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {clip ? <Group clip={clip}>{field}</Group> : field}
      </Canvas>
    </View>
  )
}

const StaticGradient = memo(function StaticGradient({
  palette,
  grainAmount,
  dots,
  bottomRadius,
  style,
}: FieldProps) {
  const { width, height, onLayout } = useFieldSize()
  const colors = usePaletteColors(palette)
  const uniforms = useMemo(
    () => buildUniforms(palette, colors, width, height, grainAmount, dots, 0, 0, 0),
    [colors, dots, grainAmount, height, palette, width]
  )

  return (
    <GradientCanvas
      bottomRadius={bottomRadius}
      fallbackColor={palette.colors[0]}
      height={height}
      onLayout={onLayout}
      style={style}
      uniforms={uniforms}
      width={width}
    />
  )
})

const AnimatedGradient = memo(function AnimatedGradient({
  palette,
  grainAmount,
  dots,
  bottomRadius,
  style,
}: FieldProps) {
  const { width, height, onLayout } = useFieldSize()
  const colors = usePaletteColors(palette)
  const reduceMotion = usePrefersReducedMotion()
  const time = useSharedValue(0)
  const motionEnabled = !reduceMotion

  useFrameCallback((frameInfo) => {
    if (motionEnabled && frameInfo.timeSincePreviousFrame !== null) {
      time.value += (frameInfo.timeSincePreviousFrame / 1000) * DRIFT_SPEED
    }
  }, motionEnabled)

  const stillUniforms = useMemo(
    () => buildUniforms(palette, colors, width, height, grainAmount, dots, 0, 0, 0),
    [colors, dots, grainAmount, height, palette, width]
  )
  const driftingUniforms = useDerivedValue(
    () => buildUniforms(palette, colors, width, height, grainAmount, dots, time.value, 0, 0),
    [colors, dots, grainAmount, height, palette, time, width]
  )

  return (
    <GradientCanvas
      bottomRadius={bottomRadius}
      fallbackColor={palette.colors[0]}
      height={height}
      onLayout={onLayout}
      style={style}
      uniforms={motionEnabled ? driftingUniforms : stillUniforms}
      width={width}
    />
  )
})

const PulsingGradient = memo(function PulsingGradient({
  palette,
  grainAmount,
  dots,
  bottomRadius,
  style,
}: FieldProps) {
  const { width, height, onLayout } = useFieldSize()
  const colors = usePaletteColors(palette)
  const clock = useClock()
  const uniforms = useSharedValue(
    buildUniforms(palette, colors, width, height, grainAmount, dots, 0, 0, 1)
  )

  useAnimatedReaction(
    () => clock.value,
    (timeMs) => {
      uniforms.value = buildUniforms(
        palette,
        colors,
        width,
        height,
        grainAmount,
        dots,
        0,
        timeMs / 1000,
        1
      )
      notifyChange(uniforms)
    },
    [clock, colors, dots, grainAmount, height, palette, uniforms, width]
  )

  return (
    <GradientCanvas
      bottomRadius={bottomRadius}
      fallbackColor={palette.colors[0]}
      height={height}
      onLayout={onLayout}
      style={style}
      uniforms={uniforms}
      width={width}
    />
  )
})

function MotionDots(props: FieldProps) {
  const reduceMotion = usePrefersReducedMotion()
  if (reduceMotion) return <StaticGradient {...props} />
  return <PulsingGradient {...props} />
}

export const GradientBackground = memo(function GradientBackground({
  token = "topSection",
  animated = false,
  grain,
  dotSpacing = 0,
  dotMotion = false,
  bottomRadius = 0,
  style,
}: GradientBackgroundProps) {
  const palette = gradients[token]
  const grainAmount = grain ?? palette.grain
  const dots = useMemo<DotField>(
    () =>
      dotSpacing > 0
        ? { spacing: dotSpacing, radius: DOT_RADIUS, color: DOT_COLOR }
        : NO_DOTS,
    [dotSpacing]
  )
  const Field = animated ? AnimatedGradient : dotMotion ? MotionDots : StaticGradient

  return (
    <Field
      bottomRadius={bottomRadius}
      dots={dots}
      grainAmount={grainAmount}
      palette={palette}
      style={style}
    />
  )
})

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
})

export type { GradientBackgroundProps }
