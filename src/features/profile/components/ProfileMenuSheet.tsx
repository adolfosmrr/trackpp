import { useEffect, useRef } from "react"
import { StyleSheet, useWindowDimensions } from "react-native"
import { BottomSheetModal } from "@gorhom/bottom-sheet"

import { AppSheet } from "../../../components/layout/AppSheet"
import { colors } from "../../../theme"
import { registerProfileMenu } from "../profileMenu"
import { ProfileScreen } from "../screens/ProfileScreen"

export function ProfileMenuSheet() {
  const ref = useRef<BottomSheetModal>(null)
  const { height } = useWindowDimensions()

  useEffect(() => {
    return registerProfileMenu(
      () => ref.current?.present(),
      () => ref.current?.dismiss(),
    )
  }, [])

  return (
    <AppSheet
      ref={ref}
      canvas="background"
      enableDynamicSizing={false}
      snapPoints={[Math.round(height * 0.88)]}
      enablePanDownToClose
      handleIndicatorStyle={styles.handle}
    >
      <ProfileScreen />
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: colors.borderStrong,
  },
})
