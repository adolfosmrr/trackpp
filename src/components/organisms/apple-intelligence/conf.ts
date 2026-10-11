import { Skia } from "@shopify/react-native-skia";

const SHADER_SOURCE = Skia.RuntimeEffect.Make(`
  uniform float  iTime;
  uniform float  intensity;
  uniform float2 iResolution;

  uniform float  uMargin;
  uniform float  uExcess;
  uniform float  uRadius;
  uniform float  uWaveSpeed;
  uniform float  uWaveStrength;
  uniform float2 uWaveOrigin;
  uniform float  uNoiseScale;
  uniform float  uNoiseSpeed;
  uniform float  uNoiseStrength;
  uniform float  uGlowSpeed;
  uniform float  uGlowSaturation;
  uniform float  uGlowLightness;
  uniform float  uShimmerAmount;
  uniform float  uShimmerSpeed;

  uniform int    uColorCount;
  uniform float3 uColor0;
  uniform float3 uColor1;
  uniform float3 uColor2;
  uniform float3 uColor3;
  uniform float3 uColor4;
  uniform float3 uColor5;
  uniform float3 uColor6;
  uniform float3 uColor7;

  float3 hash33(float3 p3) {
    p3 = fract(p3 * float3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(float3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
  }

  float snoise3(float3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    float3 i  = floor(p + (p.x + p.y + p.z) * K1);
    float3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    float3 e  = step(float3(0.0), d0 - d0.yzx);
    float3 i1 = e * (1.0 - e.zxy);
    float3 i2 = 1.0 - e.zxy * (1.0 - e);
    float3 d1 = d0 - (i1 - K2);
    float3 d2 = d0 - (i2 - K1);
    float3 d3 = d0 - 0.5;
    float4 h = max(0.6 - float4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    float4 n = h * h * h * h * float4(
      dot(d0, hash33(i)), dot(d1, hash33(i + i1)),
      dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
    return dot(float4(31.316), n);
  }

  float3 hsl2rgb(float h, float s, float l) {
    float3 rgb = clamp(abs(mod(h * 6.0 + float3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }

  float3 getColor(int idx) {
    if (idx == 0) return uColor0;
    if (idx == 1) return uColor1;
    if (idx == 2) return uColor2;
    if (idx == 3) return uColor3;
    if (idx == 4) return uColor4;
    if (idx == 5) return uColor5;
    if (idx == 6) return uColor6;
    return uColor7;
  }

  float3 sampleGradient(float t) {
    float ft = fract(t) * float(uColorCount);
    int i0 = int(floor(ft));
    int i1 = i0 + 1;
    if (i1 >= uColorCount) i1 = 0;
    float f = fract(ft);
    f = f * f * (3.0 - 2.0 * f);
    return mix(getColor(i0), getColor(i1), f);
  }

  half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution;
    float range = intensity;

    float2 margin = uMargin / iResolution;
    float2 excess = uExcess / iResolution;
    float2 radius = uRadius / iResolution;
    float2 point  = abs(uv - 0.5);
    float2 corner = 0.5 - margin - radius - excess;
    float2 offset = max(point - corner, 0.0);
    float dist    = length(offset / radius) - 1.0;

    float wave = 0.85 + 0.15 * sin(
      iTime * uWaveSpeed + uv.y * uWaveStrength + uWaveOrigin.x + uWaveOrigin.y
    );
    float vol   = 0.35 + 0.15 * sin(iTime * 2.0);
    float noise = max(0.0, snoise3(float3(uv * uNoiseScale, iTime / uNoiseSpeed)) * (vol * uNoiseStrength));
    float edge = smoothstep(uMargin / uRadius, (uMargin + uExcess) / uRadius, dist + noise);

    float angle = atan(uv.y - 0.5, uv.x - 0.5);
    float t     = fract((angle / 6.2832) + iTime * uGlowSpeed);

    float3 glow;
    if (uColorCount > 0) {
      glow = sampleGradient(t);
    } else {
      glow = hsl2rgb(t, uGlowSaturation, uGlowLightness);
    }

    float shimmer = 0.5 + 0.5 * sin(angle * 3.0 + iTime * uShimmerSpeed);
    glow = mix(glow, glow * 1.4, shimmer * uShimmerAmount);

    return half4(half3(glow), half(edge * range * wave));
  }
`)!;

export { SHADER_SOURCE };
