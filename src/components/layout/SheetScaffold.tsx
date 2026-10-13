import { useMemo, useState, type ReactNode } from "react"
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { colors, layout } from "../../theme"
import { SheetHeader } from "./SheetHeader"

type SheetScaffoldProps = {
  title: string
  onClose: () => void
  closeAccessibilityLabel?: string
  children: ReactNode
  footer?: ReactNode
  contentStyle?: StyleProp<ViewStyle>
}

export function SheetScaffold({
  title,
  onClose,
  closeAccessibilityLabel,
  children,
  footer,
  contentStyle,
}: SheetScaffoldProps) {
  const insets = useSafeAreaInsets()
  const scrollY = useMemo(() => new Animated.Value(0), [])
  const [footerHeight, setFooterHeight] = useState(0)

  const onScroll = useMemo(
    () => Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true },
    ),
    [scrollY],
  )

  function handleFooterLayout(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.height
    setFooterHeight((current) => (current === next ? current : next))
  }

  const bottomPadding = footer
    ? (Platform.OS === "ios" ? footerHeight + insets.bottom : 12)
    : insets.bottom + layout.titleContentGap

  return (
    <>
      <Animated.ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {children}
      </Animated.ScrollView>
      {footer ? (
        <View
          collapsable={false}
          onLayout={handleFooterLayout}
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, layout.titleContentGap) }]}
        >
          {footer}
        </View>
      ) : null}
      <SheetHeader
        closeAccessibilityLabel={closeAccessibilityLabel}
        onClose={onClose}
        scrollY={scrollY}
        title={title}
      />
    </>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: layout.titleContentGap,
    paddingHorizontal: layout.sheetPadding,
    paddingTop: layout.sheetHeaderHeight,
  },
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: layout.sheetPadding,
    paddingTop: 12,
    zIndex: 1,
  },
})
