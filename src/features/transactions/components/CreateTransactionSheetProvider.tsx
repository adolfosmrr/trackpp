import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { BottomSheetModal } from "@gorhom/bottom-sheet"

import { CreateTransactionBottomSheet } from "./CreateTransactionBottomSheet"
import type { CreateMovementMode, TransactionSheetRequest } from "../types"
import type { FixedExpense } from "../../fixedExpenses/types"

type CreateTransactionSheetContextValue = {
  openCreateTransaction: (initialMode?: CreateMovementMode) => void
  openEditFixedExpense: (fixedExpense: FixedExpense, period: string) => void
}

const CreateTransactionSheetContext = createContext<CreateTransactionSheetContextValue | null>(null)

export function CreateTransactionSheetProvider({ children }: { children: ReactNode }) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [mounted, setMounted] = useState(false)
  const [request, setRequest] = useState<TransactionSheetRequest>({
    kind: "create",
    initialMode: "expense",
  })

  useEffect(() => {
    if (!mounted) return

    const frame = requestAnimationFrame(() => bottomSheetModalRef.current?.present())
    return () => cancelAnimationFrame(frame)
  }, [mounted])

  function openCreateTransaction(nextMode: CreateMovementMode = "expense") {
    setRequest({ kind: "create", initialMode: nextMode })
    setMounted(true)
  }

  function openEditFixedExpense(fixedExpense: FixedExpense, period: string) {
    setRequest({ kind: "edit-fixed", fixedExpense, period })
    setMounted(true)
  }

  function handleDismiss() {
    setMounted(false)
  }

  return (
    <CreateTransactionSheetContext.Provider
      value={{ openCreateTransaction, openEditFixedExpense }}
    >
      {children}
      {mounted ? (
        <CreateTransactionBottomSheet
          key={request.kind === "edit-fixed"
            ? `edit-fixed-${request.fixedExpense.id}-${request.period}`
            : `create-${request.initialMode}`}
          ref={bottomSheetModalRef}
          request={request}
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
