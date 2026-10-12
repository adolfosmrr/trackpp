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
    sheetAllowedDetents: detents,
    sheetExpandsWhenScrolledToEdge: expandsWhenScrolledToEdge,
    contentStyle: {
      backgroundColor: Platform.OS === "ios" ? "transparent" : colors.background,
    },
  }
}
