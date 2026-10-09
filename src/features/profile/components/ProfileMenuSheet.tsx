import { useEffect, useRef } from "react"
import { StyleSheet, useWindowDimensions } from "react-native"
import { BottomSheetModal } from "@gorhom/bottom-sheet"

import { colors, radii } from "../../../theme"
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
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={false}
      snapPoints={[Math.round(height * 0.88)]}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <ProfileScreen />
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  handle: {
    backgroundColor: colors.borderStrong,
  },
})
