import type { ReactNode } from "react"
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type TopSectionProps = {
    children?: ReactNode
    style?: StyleProp<ViewStyle>
}

export function TopSection({ children, style }: TopSectionProps) {
    const insets = useSafeAreaInsets()

    return (
        <View
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
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#000000",
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 60,
    },
})
