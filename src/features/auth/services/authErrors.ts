export const SHORT_PASSWORD_MESSAGE =
  "La contraseña es demasiado corta. Usa al menos 6 caracteres."

const FALLBACK = "No se pudo completar. Intenta de nuevo."

export function authErrorMessage(error: unknown) {
  const code = readCode(error)
  const message = error instanceof Error ? error.message : ""
  return messageFor(code, message) ?? (message || FALLBACK)
}

function messageFor(code: string | null, message: string) {
  const text = message.toLowerCase()
  if (code === "invalid_credentials" || text.includes("invalid login credentials")) {
    return "El correo o la contraseña no coinciden."
  }
  if (code === "email_not_confirmed" || text.includes("email not confirmed")) {
    return "Confirma tu correo antes de entrar."
  }
  if (
    code === "user_already_exists" ||
    text.includes("user already registered") ||
    text.includes("already been registered")
  ) {
    return "Ese correo ya tiene una cuenta."
  }
  if (code === "weak_password" || text.includes("password should be at least")) {
    return SHORT_PASSWORD_MESSAGE
  }
  if (code === "over_request_rate_limit" || text.includes("rate limit")) {
    return "Espera un momento e intenta de nuevo."
  }
  if (code === "signup_disabled") {
    return "El registro con correo está desactivado."
  }
  if (code === "otp_expired" || text.includes("expired")) {
    return "El enlace venció. Pide uno nuevo."
  }
  if (
    code === "flow_state_expired" ||
    code === "flow_state_not_found" ||
    text.includes("code verifier")
  ) {
    return "El enlace no se pudo abrir en este dispositivo. Pide uno nuevo desde la app."
  }
  if (code === "validation_failed") {
    return "Revisa el correo y la contraseña."
  }
  return null
}

function readCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return null
  return typeof error.code === "string" ? error.code : null
}
