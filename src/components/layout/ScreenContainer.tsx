import type { ReactNode } from "react"
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import {
    BottomTabBarHeightContext,
    useBottomTabBarHeight,
} from "@react-navigation/bottom-tabs"
import { useContext } from "react"

type ScreenContainerProps = {
    children: ReactNode
    style?: StyleProp<ViewStyle>
}

// Native Bottom Tabs does not expose BottomTabBarHeightContext, so its
// screens use the navigator's own inset handling instead of a guessed height.
export function ScreenContainer({
    children,
    style,
}: ScreenContainerProps) {
    const tabBarHeightContext = useContext(BottomTabBarHeightContext)

    if (tabBarHeightContext === undefined) {
        return (
            <ScreenContainerView paddingBottom={0} style={style}>
                {children}
            </ScreenContainerView>
        )
    }

    return (
        <ScreenContainerWithTabBar style={style}>
            {children}
        </ScreenContainerWithTabBar>
    )
}

function ScreenContainerWithTabBar({
    children,
    style,
}: ScreenContainerProps) {
    const tabBarHeight = useBottomTabBarHeight()

    return (
        <ScreenContainerView paddingBottom={tabBarHeight} style={style}>
            {children}
        </ScreenContainerView>
    )
}

function ScreenContainerView({
    children,
    paddingBottom,
    style,
}: ScreenContainerProps & { paddingBottom: number }) {
    return (
        <View
            style={[
                styles.container,
                { paddingBottom },
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
