import type { ReactNode } from "react"
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"

type ScreenContainerProps = {
    children: ReactNode
    style?: StyleProp<ViewStyle>
}

// Intended for screens rendered inside a Bottom Tab Navigator. The hook
// intentionally preserves React Navigation's explicit context requirement.
export function ScreenContainer({
    children,
    style,
}: ScreenContainerProps) {
    const tabBarHeight = useBottomTabBarHeight()

    return (
        <View
            style={[
                styles.container,
                { paddingBottom: tabBarHeight },
                style,
            ]}
        >
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
})
