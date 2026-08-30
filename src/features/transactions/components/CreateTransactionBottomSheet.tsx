import { forwardRef } from "react"
import { StyleSheet, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet"

import { CreateTransactionForm } from "./CreateTransactionForm"

type CreateTransactionBottomSheetProps = {
  onDismiss: () => void
  onSuccess: () => void
}

export const CreateTransactionBottomSheet = forwardRef<
  BottomSheetModal,
  CreateTransactionBottomSheetProps
>(function CreateTransactionBottomSheet({ onDismiss, onSuccess }, ref) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.6}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
      onDismiss={onDismiss}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetView
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <CreateTransactionForm onSuccess={onSuccess} />
      </BottomSheetView>
    </BottomSheetModal>
  )
})

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: "#999999",
  },
})
