import { supabase } from "../../../services/supabase"

export type Profile = {
  id: string
  name: string | null
  avatar_url: string | null
  currency: string
  timezone: string
  created_at: string
  updated_at: string
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
