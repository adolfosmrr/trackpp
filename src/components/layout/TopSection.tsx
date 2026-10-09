import type { ReactNode } from "react"
import {
    LayoutChangeEvent,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useSharedValue, type SharedValue } from "react-native-reanimated"

import { colors, meshColors, radii } from "../../theme"
import { GridBackground } from "./GridBackground"
import { MeshGradient } from "../visual/MeshGradient"

const TOP_SECTION_GRADIENT_COLORS = meshColors.auth
const SHOW_TOP_SECTION_GRADIENT = false

type TopSectionProps = {
    children?: ReactNode
    mode?: TopSectionMode
    renderContent?: (collapseProgress: SharedValue<number>) => ReactNode
    style?: StyleProp<ViewStyle>
    onLayout?: (event: LayoutChangeEvent) => void
    overlay?: boolean
}

export type TopSectionMode = "interactive" | "collapsed"

export function TopSection({
    children,
    mode = "interactive",
    renderContent,
    style,
    onLayout,
    overlay = false,
}: TopSectionProps) {
    const insets = useSafeAreaInsets()
    const modeCollapseProgress = useSharedValue(mode === "collapsed" ? 1 : 0)

    return (
        <View
            onLayout={onLayout}
            pointerEvents={overlay ? "box-none" : "auto"}
            style={[
                styles.container,
                {
                    minHeight: insets.top + 120,
                    paddingTop: insets.top,
                    paddingHorizontal: 20,
                },
                style,
            ]}
        >
            <View pointerEvents="none" style={styles.backgroundLayer}>
                {SHOW_TOP_SECTION_GRADIENT && (
                    <MeshGradient
                        animated
                        blur={0.5}
                        colors={TOP_SECTION_GRADIENT_COLORS}
                        intensity={1}
                        noise={0.3}
                        speed={0.5}
                        style={StyleSheet.absoluteFill}
                    />
                )}
                <GridBackground />
            </View>
            {renderContent ? renderContent(modeCollapseProgress) : children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
    },
    backgroundLayer: {
        backgroundColor: colors.background,
        borderBottomLeftRadius: radii.xl,
        borderBottomRightRadius: radii.xl,
        bottom: 0,
        left: 0,
        overflow: "hidden",
        position: "absolute",
        right: 0,
        top: 0,
    },
})
