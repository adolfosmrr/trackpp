import { supabase } from "./supabase"

const API_URL = "http://192.168.0.30:3000"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(options.headers)

  if (session?.access_token) {
    headers.set(
      "Authorization",
      `Bearer ${session.access_token}`
    )
  }

  // Solo indicar JSON cuando realmente enviamos un body.
  if (options.body) {
    headers.set(
      "Content-Type",
      "application/json"
    )
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  )

  const text = await response.text()

  let body: unknown

  try {
    body = text
      ? JSON.parse(text)
      : null
  } catch {
    body = text
  }

  if (!response.ok) {
    const responseBody =
      body && typeof body === "object"
        ? body as Record<string, unknown>
        : null
    const code =
      typeof responseBody?.error === "string"
        ? responseBody.error
        : undefined
    const message =
      typeof responseBody?.message === "string"
        ? responseBody.message
        : code
          ? code
        : typeof body === "string" &&
            body
          ? body
          : `HTTP ${response.status}`

    throw new ApiError(message, response.status, code)
  }

  return body as T
}
