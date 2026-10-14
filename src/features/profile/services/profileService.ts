import type { User } from "@supabase/supabase-js"

import { supabase } from "../../../services/supabase"

export type Profile = {
  id: string
  name: string | null
  last_name?: string | null
  avatar_url: string | null
  birth_date: string | null
  alias: string | null
  currency: string
  timezone: string
  created_at: string
  updated_at: string
}

type ProfileUpdate = {
  name: string | null
  lastName: string | null
  birthDate: string | null
  alias: string | null
}

type ProfileWrite = ProfileUpdate & {
  id?: string
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) {
    throw error
  }

  return data as Profile
}

export async function updateProfile(userId: string, input: ProfileUpdate) {
  return writeProfile(userId, input, "update")
}

export async function applySignupProfile(user: User) {
  const given = readMeta(user.user_metadata, "given_name")
  const family = readMeta(user.user_metadata, "family_name")
  const birth = readMeta(user.user_metadata, "birth_date")
  if (!given && !family && !birth) return

  let existing: Profile | null = null
  try {
    existing = await getProfile(user.id)
  } catch (error) {
    if (errorCode(error) !== "PGRST116") return
  }

  const name = existing?.name?.trim() ? existing.name : given
  const lastName = existing?.last_name?.trim() ? existing.last_name : family
  const birthDate = existing?.birth_date ?? (isIsoDate(birth) ? birth : null)
  if (
    existing &&
    existing.name === name &&
    (existing.last_name ?? null) === lastName &&
    existing.birth_date === birthDate
  ) {
    return
  }

  try {
    await writeProfile(user.id, {
      name,
      lastName,
      birthDate,
      alias: existing?.alias ?? null,
    }, existing ? "update" : "insert")
  } catch (error) {
    if (__DEV__) console.error("[Profile] signup sync", error)
  }
}

async function writeProfile(
  userId: string,
  input: ProfileUpdate,
  mode: "update" | "insert",
) {
  const withLastName = await sendProfile(userId, input, mode, true)
  if (withLastName.ok) return withLastName.profile
  if (!isMissingLastName(withLastName.error)) throw withLastName.error

  const fallback = await sendProfile(userId, {
    ...input,
    name: input.lastName
      ? [input.name, input.lastName].filter((part) => part?.trim()).join(" ")
      : input.name,
    lastName: null,
  }, mode, false)
  if (fallback.ok) return fallback.profile
  throw fallback.error
}

async function sendProfile(
  userId: string,
  input: ProfileUpdate,
  mode: "update" | "insert",
  includeLastName: boolean,
): Promise<{ ok: true; profile: Profile } | { ok: false; error: unknown }> {
  const row: ProfileWrite = {
    name: input.name,
    birthDate: input.birthDate,
    alias: input.alias,
    lastName: input.lastName,
  }
  const payload = {
    name: row.name,
    birth_date: row.birthDate,
    alias: row.alias,
    updated_at: new Date().toISOString(),
    ...(includeLastName ? { last_name: row.lastName } : {}),
    ...(mode === "insert" ? { id: userId } : {}),
  }
  const query = mode === "insert"
    ? supabase.from("profiles").insert(payload).select("*").single()
    : supabase.from("profiles").update(payload).eq("id", userId).select("*").single()
  const { data, error } = await query
  if (error) return { ok: false, error }
  return { ok: true, profile: data as Profile }
}

function isMissingLastName(error: unknown) {
  const code = errorCode(error)
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  return (code === "PGRST204" || code === "42703") && message.includes("last_name")
}

function errorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return null
  return typeof error.code === "string" ? error.code : null
}

function readMeta(metadata: User["user_metadata"], key: string) {
  if (!metadata || typeof metadata !== "object" || !(key in metadata)) return null
  const value = Reflect.get(metadata, key)
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function isIsoDate(value: string | null): value is string {
  return value != null && /^\d{4}-\d{2}-\d{2}$/.test(value)
}
