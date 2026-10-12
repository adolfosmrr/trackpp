import { forwardRef } from "react"
import { StyleSheet, useWindowDimensions } from "react-native"
import { colors } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet"

import { AppSheet } from "../../../components/layout/AppSheet"

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
    <AppSheet
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.6}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={styles.handleIndicator}
      onDismiss={onDismiss}
      backdropComponent={(props) => <TransactionBlurBackdrop {...props} />}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <CreateTransactionForm request={request} onSuccess={onSuccess} />
      </BottomSheetScrollView>
    </AppSheet>
  )
})

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.borderStrong,
  },
})
