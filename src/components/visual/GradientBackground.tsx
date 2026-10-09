import { memo, useEffect, useMemo, useState, type ComponentProps } from "react"
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { Canvas, Fill, Shader, Skia, vec } from "@shopify/react-native-skia"
import { useDerivedValue, useFrameCallback, useSharedValue } from "react-native-reanimated"

import { gradients, type GradientName, type GradientPalette } from "../../theme"

type GradientBackgroundProps = {
  token?: GradientName
  animated?: boolean
  grain?: number
  style?: StyleProp<ViewStyle>
}

type FieldProps = {
  palette: GradientPalette
  grainAmount: number
  style?: StyleProp<ViewStyle>
}

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

float hash(float2 p) {
  float3 p3 = fract(float3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
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
  time: number
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
  }
}

function GradientCanvas({
  uniforms,
  onLayout,
  fallbackColor,
  style,
}: {
  uniforms: ComponentProps<typeof Shader>["uniforms"]
  onLayout: (event: LayoutChangeEvent) => void
  fallbackColor: string
  style?: StyleProp<ViewStyle>
}) {
  if (!GRADIENT_SHADER) {
    return (
      <View
        pointerEvents="none"
        style={[styles.fill, style, { backgroundColor: fallbackColor }]}
      />
    )
  }

  return (
    <View pointerEvents="none" onLayout={onLayout} style={[styles.fill, style]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <Shader source={GRADIENT_SHADER} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  )
}

const StaticGradient = memo(function StaticGradient({ palette, grainAmount, style }: FieldProps) {
  const { width, height, onLayout } = useFieldSize()
  const colors = usePaletteColors(palette)
  const uniforms = useMemo(
    () => buildUniforms(palette, colors, width, height, grainAmount, 0),
    [colors, grainAmount, height, palette, width]
  )

  return (
    <GradientCanvas
      fallbackColor={palette.colors[0]}
      onLayout={onLayout}
      style={style}
      uniforms={uniforms}
    />
  )
})

const AnimatedGradient = memo(function AnimatedGradient({ palette, grainAmount, style }: FieldProps) {
  const { width, height, onLayout } = useFieldSize()
  const colors = usePaletteColors(palette)
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)
  const time = useSharedValue(0)
  const motionEnabled = !reduceMotionEnabled

  useEffect(() => {
    let mounted = true

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotionEnabled(enabled)
    })

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled
    )

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  useFrameCallback((frameInfo) => {
    if (motionEnabled && frameInfo.timeSincePreviousFrame !== null) {
      time.value += (frameInfo.timeSincePreviousFrame / 1000) * DRIFT_SPEED
    }
  }, motionEnabled)

  const stillUniforms = useMemo(
    () => buildUniforms(palette, colors, width, height, grainAmount, 0),
    [colors, grainAmount, height, palette, width]
  )
  const driftingUniforms = useDerivedValue(
    () => buildUniforms(palette, colors, width, height, grainAmount, time.value),
    [colors, grainAmount, height, palette, time, width]
  )

  return (
    <GradientCanvas
      fallbackColor={palette.colors[0]}
      onLayout={onLayout}
      style={style}
      uniforms={motionEnabled ? driftingUniforms : stillUniforms}
    />
  )
})

export const GradientBackground = memo(function GradientBackground({
  token = "topSection",
  animated = false,
  grain,
  style,
}: GradientBackgroundProps) {
  const palette = gradients[token]
  const grainAmount = grain ?? palette.grain
  const Field = animated ? AnimatedGradient : StaticGradient

  return <Field grainAmount={grainAmount} palette={palette} style={style} />
})

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
})

export type { GradientBackgroundProps }
