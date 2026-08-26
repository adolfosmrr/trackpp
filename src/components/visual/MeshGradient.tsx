import { memo, useEffect, useMemo, useState } from "react"
import {
  AccessibilityInfo,
  StyleSheet,
  type StyleProp,
  useWindowDimensions,
  type ViewStyle,
  View,
} from "react-native"
import {
  Canvas,
  Fill,
  Shader,
  Skia,
  vec,
} from "@shopify/react-native-skia"
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated"

type MeshGradientProps = {
  colors?: [string, string, string, string]
  speed?: number
  blur?: number
  noise?: number
  intensity?: number
  width?: ViewStyle["width"]
  height?: ViewStyle["height"]
  borderRadius?: number
  animated?: boolean
  style?: StyleProp<ViewStyle>
}

const DEFAULT_COLORS: [string, string, string, string] = [
  "#0E7490",
  "#F59E0B",
  "#D9F99D",
  "#164E63",
]

const MESH_GRADIENT_SHADER = Skia.RuntimeEffect.Make(`
uniform float2 resolution;
uniform float time;
uniform float noise;
uniform float blur;
uniform float intensity;
uniform float4 color1;
uniform float4 color2;
uniform float4 color3;
uniform float4 color4;

float hash(float2 p) {
  float3 p3 = fract(float3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smoothNoise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(float2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  float maxValue = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * smoothNoise(p * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value / maxValue;
}

float3 mod289(float3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
float2 mod289(float2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
float3 permute(float3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(float2 v) {
  const float4 C = float4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  float2 i = floor(v + dot(v, C.yy));
  float2 x0 = v - i + dot(i, C.xx);
  float2 i1 = (x0.x > x0.y) ? float2(1.0, 0.0) : float2(0.0, 1.0);
  float4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  float3 p = permute(permute(i.y + float3(0.0, i1.y, 1.0)) + i.x + float3(0.0, i1.x, 1.0));
  float3 m = max(0.5 - float3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m * m * m;
  float3 x = 2.0 * fract(p * C.www) - 1.0;
  float3 h = abs(x) - 0.5;
  float3 ox = floor(x + 0.5);
  float3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  float3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float2 warp(float2 p, float t) {
  float2 q = float2(
    fbm(p + 0.1 * t, 4),
    fbm(p + float2(5.2, 1.3) + 0.12 * t, 4)
  );
  float2 r = float2(
    fbm(p + 4.0 * q + float2(1.7, 9.2) + 0.15 * t, 4),
    fbm(p + 4.0 * q + float2(8.3, 2.8) + 0.13 * t, 4)
  );
  return p + 2.0 * r * blur;
}

float metaball(float2 uv, float2 center, float radius) {
  float d = length(uv - center);
  return radius / (d * d + 0.001);
}

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / resolution;
  float aspect = resolution.x / resolution.y;
  float2 st = uv;
  st.x *= aspect;
  float t = time * 0.15;
  float2 warpedUV = warp(st * 1.5, t);

  float2 p1 = float2(0.15 * aspect + 0.2 * sin(t * 0.7 + 1.0) * aspect, 0.3 + 0.25 * cos(t * 0.5 + 0.5));
  float2 p2 = float2(0.5 * aspect + 0.25 * cos(t * 0.4 + 2.0) * aspect, 0.2 + 0.2 * sin(t * 0.6 + 1.5));
  float2 p3 = float2(0.5 * aspect + 0.3 * sin(t * 0.3 + 3.0) * aspect, 0.55 + 0.25 * cos(t * 0.5 + 2.5));
  float2 p4 = float2(0.85 * aspect + 0.2 * cos(t * 0.5 + 4.0) * aspect, 0.75 + 0.2 * sin(t * 0.4 + 3.5));

  float noiseScale = 0.3 * noise;
  p1 += noiseScale * float2(snoise(p1 + t), snoise(p1.yx + t));
  p2 += noiseScale * float2(snoise(p2 + t * 1.1), snoise(p2.yx + t * 1.1));
  p3 += noiseScale * float2(snoise(p3 + t * 0.9), snoise(p3.yx + t * 0.9));
  p4 += noiseScale * float2(snoise(p4 + t * 1.2), snoise(p4.yx + t * 1.2));

  float baseRadius = 0.4 + blur * 0.3;
  float w1 = metaball(st, p1, baseRadius * 0.9);
  float w2 = metaball(st, p2, baseRadius * 1.1);
  float w3 = metaball(st, p3, baseRadius * 1.2);
  float w4 = metaball(st, p4, baseRadius * 0.85);
  float warpNoise = fbm(warpedUV * 2.0, 5) * noise * 1.5;
  w1 *= 1.0 + warpNoise * 0.5;
  w2 *= 1.0 - warpNoise * 0.3;
  w3 *= 1.0 + warpNoise * 0.4;
  w4 *= 1.0 - warpNoise * 0.2;

  float total = w1 + w2 + w3 + w4 + 0.0001;
  w1 /= total;
  w2 /= total;
  w3 /= total;
  w4 /= total;
  float3 col = color1.rgb * w1 + color2.rgb * w2 + color3.rgb * w3 + color4.rgb * w4;
  float colorVar = fbm(warpedUV * 3.0 + t * 0.5, 3) * 0.08 * noise;
  col += colorVar * (color2.rgb - color4.rgb);
  float grain = (hash(fragCoord + fract(time * 60.0)) * 2.0 - 1.0) * 0.025 * noise;
  col += grain;
  col = mix(float3(1.0), col, intensity);
  col = clamp(col, 0.0, 1.0);
  return half4(col, 1.0);
}
`)

function hexToRgb(value: string) {
  const hex = value.replace("#", "")
  const normalized = hex.length === 3
    ? hex.split("").map((part) => `${part}${part}`).join("")
    : hex
  const parsed = Number.parseInt(normalized, 16)

  if (!Number.isFinite(parsed) || normalized.length !== 6) {
    return { r: 0, g: 0, b: 0 }
  }

  return {
    r: ((parsed >> 16) & 255) / 255,
    g: ((parsed >> 8) & 255) / 255,
    b: (parsed & 255) / 255,
  }
}

function clamp(value: number, min: number, max: number) {
  "worklet"
  return Math.max(min, Math.min(max, value))
}

export const MeshGradient = memo(function MeshGradient({
  colors = DEFAULT_COLORS,
  speed = 1,
  blur = 0.4,
  noise = 0.15,
  intensity = 1,
  width,
  height,
  borderRadius,
  animated = true,
  style,
}: MeshGradientProps) {
  const dimensions = useWindowDimensions()
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false)
  const motionEnabled = animated && !reduceMotionEnabled
  const initialWidth = typeof width === "number" ? width : dimensions.width
  const initialHeight = typeof height === "number" ? height : dimensions.height
  const canvasWidth = useSharedValue(Math.max(1, initialWidth))
  const canvasHeight = useSharedValue(Math.max(1, initialHeight))
  const time = useSharedValue(0)

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
      time.value += (frameInfo.timeSincePreviousFrame / 1000) * speed
    }
  }, motionEnabled)

  const safeColors = useMemo(
    () => colors.slice(0, 4).map(hexToRgb),
    [colors]
  )
  const uniforms = useDerivedValue(() => {
    return {
      resolution: vec(canvasWidth.value, canvasHeight.value),
      time: time.value,
      noise: clamp(noise, 0, 1),
      blur: clamp(blur, 0, 1),
      intensity: clamp(intensity, 0, 1),
      color1: [safeColors[0].r, safeColors[0].g, safeColors[0].b, 1],
      color2: [safeColors[1].r, safeColors[1].g, safeColors[1].b, 1],
      color3: [safeColors[2].r, safeColors[2].g, safeColors[2].b, 1],
      color4: [safeColors[3].r, safeColors[3].g, safeColors[3].b, 1],
    }
  }, [blur, canvasHeight, canvasWidth, intensity, noise, safeColors, time])

  if (!MESH_GRADIENT_SHADER) {
    return <View pointerEvents="none" style={[styles.container, style, { width, height }]} />
  }

  return (
    <View
      pointerEvents="none"
      onLayout={(event) => {
        canvasWidth.value = Math.max(1, event.nativeEvent.layout.width)
        canvasHeight.value = Math.max(1, event.nativeEvent.layout.height)
      }}
      style={[
        styles.container,
        { width: width ?? dimensions.width, height: height ?? dimensions.height },
        style,
        borderRadius === undefined ? null : { borderRadius },
      ]}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <Shader source={MESH_GRADIENT_SHADER} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
})

export type { MeshGradientProps }
