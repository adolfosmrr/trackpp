import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { BottomSheetModal } from "@gorhom/bottom-sheet"

import { CreateTransactionBottomSheet } from "./CreateTransactionBottomSheet"
import type { CreateMovementMode } from "../types"

type CreateTransactionSheetContextValue = {
  openCreateTransaction: (initialMode?: CreateMovementMode) => void
}

const CreateTransactionSheetContext = createContext<CreateTransactionSheetContextValue | null>(null)

export function CreateTransactionSheetProvider({ children }: { children: ReactNode }) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [mounted, setMounted] = useState(false)
  const [initialMode, setInitialMode] = useState<CreateMovementMode>("expense")

  useEffect(() => {
    if (!mounted) return

    const frame = requestAnimationFrame(() => bottomSheetModalRef.current?.present())
    return () => cancelAnimationFrame(frame)
  }, [mounted])

  function openCreateTransaction(nextMode: CreateMovementMode = "expense") {
    setInitialMode(nextMode)
    setMounted(true)
  }

  function handleDismiss() {
    setMounted(false)
  }

  return (
    <CreateTransactionSheetContext.Provider value={{ openCreateTransaction }}>
      {children}
      {mounted ? (
        <CreateTransactionBottomSheet
          ref={bottomSheetModalRef}
          initialMode={initialMode}
          onDismiss={handleDismiss}
          onSuccess={() => bottomSheetModalRef.current?.dismiss()}
        />
      ) : null}
    </CreateTransactionSheetContext.Provider>
  )
}

export function useCreateTransactionSheet() {
  const context = useContext(CreateTransactionSheetContext)
  if (!context) {
    throw new Error("useCreateTransactionSheet debe usarse dentro de CreateTransactionSheetProvider.")
  }

  return context
}
