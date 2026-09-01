import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { BottomSheetModal } from "@gorhom/bottom-sheet"

import { BudgetBottomSheet } from "./BudgetBottomSheet"
import type { Budget, BudgetSheetRequest } from "../types"

type BudgetSheetContextValue = {
  openCreateBudget: () => void
  openEditBudget: (budget: Budget) => void
}

const BudgetSheetContext = createContext<BudgetSheetContextValue | null>(null)

export function BudgetSheetProvider({ children }: { children: ReactNode }) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [mounted, setMounted] = useState(false)
  const [request, setRequest] = useState<BudgetSheetRequest>({ kind: "create" })

  useEffect(() => {
    if (!mounted) return

    const frame = requestAnimationFrame(() => bottomSheetModalRef.current?.present())
    return () => cancelAnimationFrame(frame)
  }, [mounted])

  function openCreateBudget() {
    setRequest({ kind: "create" })
    setMounted(true)
  }

  function openEditBudget(budget: Budget) {
    setRequest({ kind: "edit", budget })
    setMounted(true)
  }

  function handleDismiss() {
    setMounted(false)
  }

  return (
    <BudgetSheetContext.Provider value={{ openCreateBudget, openEditBudget }}>
      {children}
      {mounted ? (
        <BudgetBottomSheet
          key={request.kind === "edit" ? `edit-${request.budget.id}` : "create"}
          ref={bottomSheetModalRef}
          request={request}
          onDismiss={handleDismiss}
          onSuccess={() => bottomSheetModalRef.current?.dismiss()}
        />
      ) : null}
    </BudgetSheetContext.Provider>
  )
}

export function useBudgetSheet() {
  const context = useContext(BudgetSheetContext)
  if (!context) {
    throw new Error("useBudgetSheet debe usarse dentro de BudgetSheetProvider.")
  }

  return context
}
