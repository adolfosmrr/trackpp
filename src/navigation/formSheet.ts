import { Platform } from "react-native"
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack"

import { colors, radii } from "../theme"

export function formSheetOptions(
  detents: number[] | "fitToContents",
  expandsWhenScrolledToEdge = detents !== "fitToContents",
): NativeStackNavigationOptions {
  return {
    presentation: "formSheet",
    headerShown: false,
    sheetGrabberVisible: true,
    sheetCornerRadius: radii.topSection,
    // iOS 26 insets every detent below large (side margins and a gap above
    // the bottom edge). The large detent is the supported way to keep the
    // sheet full-width and attached to the bottom. Android sheets already
    // sit on the bottom edge, so they keep the caller's detents.
    sheetAllowedDetents: Platform.OS === "ios" ? [1] : detents,
    sheetExpandsWhenScrolledToEdge: expandsWhenScrolledToEdge,
    contentStyle: {
      backgroundColor: colors.background,
    },
  }
}
