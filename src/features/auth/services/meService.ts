import { apiFetch } from "../../../services/api"

export type MeResponse = {
  id: string
  email?: string
}

export async function getMe(): Promise<MeResponse> {
  return apiFetch("/me")
}