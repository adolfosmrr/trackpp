import { supabase } from "../../../services/supabase"

export type Profile = {
  id: string
  name: string | null
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
  birthDate: string | null
  alias: string | null
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
  const { data, error } = await supabase
    .from("profiles")
    .update({
      name: input.name,
      birth_date: input.birthDate,
      alias: input.alias,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return data as Profile
}
