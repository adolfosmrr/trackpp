import type { QueryClient } from "@tanstack/react-query"

import { getCategories } from "../../categories/services/categoryService"
import type { Category } from "../../categories/types"
import type { HouseholdMembership } from "../../households/types"
import { getLastCategoryId, setLastCategoryId } from "../../transactions/services/entryPreferences"
import { currenciesMatch } from "./pendingChargeFormat"
import { assignPendingCharge } from "../services/pendingChargeService"
import type { PendingBankCharge } from "../types"

const DEFAULT_CATEGORY_NAME = "otros gastos"

export function findPersonalHousehold(
  memberships: HouseholdMembership[] | undefined,
  selectedHouseholdId: string | null,
) {
  const personal = (memberships ?? []).filter(
    (membership) => membership.household.type === "personal",
  )
  return personal.find((membership) => membership.household.id === selectedHouseholdId)
    ?? personal[0]
    ?? null
}

export function pickAssignCategory(categories: Category[], lastCategoryId: string | null) {
  if (lastCategoryId) {
    const last = categories.find((category) => category.id === lastCategoryId)
    if (last) return last
  }
  return categories.find((category) => normalizeName(category.name) === DEFAULT_CATEGORY_NAME) ?? null
}

export async function assignChargeToPersonal(input: {
  charge: PendingBankCharge
  memberships: HouseholdMembership[] | undefined
  selectedHouseholdId: string | null
  queryClient: QueryClient
}) {
  const personal = findPersonalHousehold(input.memberships, input.selectedHouseholdId)
  if (!personal) {
    throw new Error("No tenés un espacio Personal.")
  }
  if (!currenciesMatch(personal.household.currency, input.charge.currency)) {
    throw new Error("La moneda no coincide con tu espacio Personal.")
  }

  const householdId = personal.household.id
  const categories = await input.queryClient.fetchQuery({
    queryKey: ["categories", householdId, "expense"],
    queryFn: () => getCategories(householdId, "expense"),
  })
  const lastCategoryId = await getLastCategoryId(householdId, "expense")
  const category = pickAssignCategory(categories, lastCategoryId)
  if (!category) {
    throw new Error("No encontré la categoría Otros gastos en tu espacio Personal.")
  }

  const result = await assignPendingCharge({
    chargeId: input.charge.id,
    householdId,
    categoryId: category.id,
  })
  await setLastCategoryId(householdId, "expense", category.id)
  return { ...result, householdId, category }
}

function normalizeName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
}
