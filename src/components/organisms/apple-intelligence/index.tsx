// @ts-check
import React, { memo, useCallback, useRef, useState } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Canvas, Fill, Shader } from "@shopify/react-native-skia";
import {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
} from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SiriContext } from "./context";
import { SHADER_SOURCE } from "./conf";
import { useSiriUniforms } from "./use-siri-uniforms";
import type { IAppleIntelligenceProvider, ISiriToggleOptions } from "./types";

export const SiriProvider: React.FC<IAppleIntelligenceProvider> &
  React.FunctionComponent<IAppleIntelligenceProvider> = memo<
  IAppleIntelligenceProvider & React.ComponentProps<typeof SiriProvider>
>(
  ({
    children,
    introDuration = 1200,
    outroDuration = 600,
    wave: defaultWave,
    noise: defaultNoise,
    glow: defaultGlow,
    shimmer: defaultShimmer,
    border: defaultBorder,
  }: IAppleIntelligenceProvider & React.ComponentProps<typeof SiriProvider>):
    | (React.ReactNode & React.JSX.Element & React.ReactElement)
    | null => {
    const [active, setActive] = useState<boolean>(false);
    const [layout, setLayout] = useState<{ width: number; height: number }>({
      width: 0,
      height: 0,
    });
    const busyRef = useRef<boolean>(false);

    const [overlayContent, setOverlayContent] = useState<React.ReactNode>(null);

    const overlayOpacity = useSharedValue<number>(0);

    const { iTime, intensity, uniforms, applyConfig, frameCallback } = useSiriUniforms({
      layout,
      defaultWave,
      defaultNoise,
      defaultGlow,
      defaultShimmer,
      defaultBorder,
    });

    const overlayStyle = useAnimatedStyle<
      Required<Partial<Pick<ViewStyle, "opacity">>>
    >(() => ({
      opacity: overlayOpacity.value,
    }));

    const dismiss = useCallback(() => {
      frameCallback.setActive(false);
      busyRef.current = false;
      setActive(false);
      setOverlayContent(null);
    }, [frameCallback]);

    const toggle = useCallback(
      (options?: ISiriToggleOptions) => {
        if (active) {
          busyRef.current = true;
          intensity.value = withTiming<number>(
            0,
            { duration: outroDuration, easing: Easing.out(Easing.quad) },
            (finished) => {
              if (finished) {
                overlayOpacity.value = withTiming(
                  0,
                  { duration: 200 },
                  (done) => {
                    if (done) scheduleOnRN(dismiss);
                  },
                );
              }
            },
          );
          return;
        }

        if (busyRef.current || layout.width === 0 || layout.height === 0) return;

        busyRef.current = true;
        applyConfig(options);
        intensity.value = 0;
        iTime.value = 0;
        overlayOpacity.value = 1;
        setActive(true);
        frameCallback.setActive(true);
        busyRef.current = false;

        intensity.value = withTiming(0.5, {
          duration: introDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      },
      [
        active,
        layout,
        introDuration,
        outroDuration,
        applyConfig,
        frameCallback,
        dismiss,
        intensity,
        overlayOpacity,
        iTime,
      ],
    );

    const setOverlay = useCallback((content: React.ReactNode) => {
      setOverlayContent(content);
    }, []);

    return (
      <SiriContext.Provider value={{ toggle, isActive: active, setOverlay }}>
        <View
          style={styles.container}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setLayout((current) =>
              current.width === width && current.height === height
                ? current
                : { width, height },
            );
          }}
        >
          {children}
          {active && layout.width > 0 && (
            <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]}>
              <Canvas
                opaque={false}
                pointerEvents="none"
                style={{ width: layout.width, height: layout.height }}
              >
                <Fill>
                  <Shader source={SHADER_SOURCE} uniforms={uniforms} />
                </Fill>
              </Canvas>
            </Animated.View>
          )}
        </View>
        {overlayContent}
      </SiriContext.Provider>
    );
  },
);

export default memo<
  React.FC<IAppleIntelligenceProvider> &
    React.FunctionComponent<IAppleIntelligenceProvider> &
    React.ComponentProps<typeof SiriProvider>
>(SiriProvider);

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill, zIndex: 9999 },
});
