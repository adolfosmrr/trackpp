import { forwardRef } from "react"
import { StyleSheet, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet"

import { CreateTransactionForm } from "./CreateTransactionForm"
import { TransactionBlurBackdrop } from "./TransactionBlurBackdrop"
import type { TransactionSheetRequest } from "../types"

type CreateTransactionBottomSheetProps = {
  request: TransactionSheetRequest
  onDismiss: () => void
  onSuccess: () => void
}

export const CreateTransactionBottomSheet = forwardRef<
  BottomSheetModal,
  CreateTransactionBottomSheetProps
>(function CreateTransactionBottomSheet({ request, onDismiss, onSuccess }, ref) {
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
      backdropComponent={(props) => <TransactionBlurBackdrop {...props} />}
    >
      <BottomSheetView
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <CreateTransactionForm request={request} onSuccess={onSuccess} />
      </BottomSheetView>
    </BottomSheetModal>
  )
})

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#E6E6E6",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  handleIndicator: {
    backgroundColor: "#1c1c1c",
  },
})
