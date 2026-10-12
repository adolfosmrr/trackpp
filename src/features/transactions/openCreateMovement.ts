import type { FixedExpense } from "../fixedExpenses/types"
import { getLastEntryMode, setLastEntryMode } from "./services/entryPreferences"
import type { CreateMovementMode } from "./types"
import type { CreateMovementParams } from "../../navigation/types"

export async function createMovementParams(
  initialMode?: CreateMovementMode,
): Promise<CreateMovementParams> {
  const mode = initialMode ?? await getLastEntryMode()
  await setLastEntryMode(mode)
  return { request: { kind: "create", initialMode: mode } }
}

export function editFixedExpenseParams(
  fixedExpense: FixedExpense,
  period: string,
): CreateMovementParams {
  return { request: { kind: "edit-fixed", fixedExpense, period } }
}
