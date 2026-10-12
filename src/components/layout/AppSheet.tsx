import { BottomSheetModal, type BottomSheetModalProps } from "@gorhom/bottom-sheet"
import { forwardRef } from "react"
import { StyleSheet } from "react-native"

import { colors, radii } from "../../theme"

type AppSheetCanvas = "popover" | "background"

type AppSheetProps = BottomSheetModalProps & {
  canvas?: AppSheetCanvas
}

export const AppSheet = forwardRef<BottomSheetModal, AppSheetProps>(
  function AppSheet({ backgroundStyle, canvas = "popover", style, ...props }, ref) {
    return (
      <BottomSheetModal
        {...props}
        ref={ref}
        backgroundStyle={[
          canvas === "background" ? styles.canvas : styles.popover,
          backgroundStyle,
          styles.topCorners,
        ]}
        style={[style, styles.container]}
      />
    )
  },
)

const styles = StyleSheet.create({
  topCorners: {
    borderTopLeftRadius: radii.topSection,
    borderTopRightRadius: radii.topSection,
  },
  container: {
    borderTopLeftRadius: radii.topSection,
    borderTopRightRadius: radii.topSection,
    overflow: "hidden",
  },
  dialog: {
    borderRadius: radii.topSection,
    overflow: "hidden",
  },
  popover: {
    backgroundColor: colors.popover,
  },
  canvas: {
    backgroundColor: colors.background,
  },
})

export const sheetChrome = {
  topCorners: styles.topCorners,
  dialog: styles.dialog,
}
