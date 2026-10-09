import { forwardRef } from "react"
import { StyleSheet, useWindowDimensions } from "react-native"
import { colors, radii } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetModal,
  BottomSheetScrollView,
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
      <BottomSheetScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <CreateTransactionForm request={request} onSuccess={onSuccess} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.popover,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  handleIndicator: {
    backgroundColor: colors.borderStrong,
  },
})
