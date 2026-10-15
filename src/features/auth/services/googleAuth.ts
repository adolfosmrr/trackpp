import * as WebBrowser from "expo-web-browser"

import { supabase } from "../../../services/supabase"
import {
  AUTH_REDIRECT_URL,
  claimAuthCode,
  getCallbackParam,
  releaseAuthCode,
} from "./authCallback"

const redirectTo = AUTH_REDIRECT_URL

WebBrowser.maybeCompleteAuthSession()

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  })

  if (error) {
    throw error
  }

  if (!data.url) {
    throw new Error("Supabase no devolvió una URL de autenticación")
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  if (result.type === "cancel" || result.type === "dismiss") {
    return
  }

  if (result.type !== "success") {
    throw new Error(`OAuth no completado (${result.type})`)
  }

  const callbackUrl = new URL(result.url)
  const errorCode = getCallbackParam(callbackUrl, "error")
  const errorDescription = getCallbackParam(
    callbackUrl,
    "error_description"
  )
  const code = getCallbackParam(callbackUrl, "code")

  if (errorCode || errorDescription) {
    throw new Error(
      errorDescription
        ? `Google OAuth: ${errorDescription}`
        : `Google OAuth: ${errorCode}`
    )
  }

  if (!code) {
    throw new Error("Google no devolvió un código de autenticación")
  }

  if (!claimAuthCode(code)) return

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    releaseAuthCode(code)
    const { data } = await supabase.auth.getSession()
    if (data.session) return
    throw exchangeError
  }
}
