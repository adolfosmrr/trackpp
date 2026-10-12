import { supabase } from "../../../services/supabase"

import type { HouseholdMembership } from "../types"

export async function getUserHouseholds(
  userId: string
): Promise<HouseholdMembership[]> {
  const { data, error } = await supabase
    .from("household_members")
    .select(`
      id,
      household_id,
      user_id,
      role,
      joined_at,
      household:households (
        id,
        name,
        type,
        currency,
        created_by,
        created_at
      )
    `)
    .eq("user_id", userId)

  if (error) {
    throw error
  }

  return data as unknown as HouseholdMembership[]
}

export type HouseholdKind = "personal" | "couple"

export type CreateHouseholdInput = {
  name: string
  type: HouseholdKind
  currency: string
}

export async function createHousehold(input: CreateHouseholdInput) {
  const { data, error } = await supabase.rpc("create_household", {
    p_name: input.name,
    p_type: input.type,
    p_currency: input.currency,
  })

  if (error) {
    throw error
  }

  return parseCreatedHousehold(data)
}

function parseCreatedHousehold(value: unknown): HouseholdMembership["household"] {
  const id = readString(value, "id")
  const name = readString(value, "name")
  const type = readString(value, "type")
  const currency = readString(value, "currency")
  const createdBy = readString(value, "created_by")
  const createdAt = readString(value, "created_at")

  if (!id || !name || !type || !currency || !createdBy || !createdAt) {
    throw new Error("No se pudo leer el espacio creado.")
  }

  return {
    id,
    name,
    type,
    currency,
    created_by: createdBy,
    created_at: createdAt,
  }
}

function readString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) return null
  const field = Reflect.get(value, key)
  return typeof field === "string" ? field : null
}
