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

  console.log("[Google OAuth] URL generated", {
    redirectTo,
    hasUrl: Boolean(data.url),
  })

  if (error) {
    console.log("[Google OAuth] Supabase URL error:", error.message)
    throw error
  }

  if (!data.url) {
    throw new Error("Supabase no devolvió una URL de autenticación")
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  console.log("GOOGLE AUTH RESULT:", {
    type: result.type,
    hasCallbackUrl: result.type === "success",
  })

  if (result.type === "cancel") {
    console.log("[Google OAuth] OAuth canceled")
    return
  }

  if (result.type === "dismiss") {
    console.log("[Google OAuth] OAuth dismissed")
    return
  }

  if (result.type !== "success") {
    console.log("[Google OAuth] OAuth did not complete:", result.type)
    throw new Error(`OAuth no completado (${result.type})`)
  }

  const callbackUrl = new URL(result.url)
  const errorCode = getCallbackParam(callbackUrl, "error")
  const errorDescription = getCallbackParam(
    callbackUrl,
    "error_description"
  )
  const code = getCallbackParam(callbackUrl, "code")

  console.log("GOOGLE CALLBACK URL:", {
    scheme: callbackUrl.protocol.replace(":", ""),
    host: callbackUrl.host,
    hasCode: Boolean(code),
    error: errorCode,
    error_description: errorDescription,
  })

  if (errorCode || errorDescription) {
    throw new Error(
      errorDescription
        ? `Google OAuth: ${errorDescription}`
        : `Google OAuth: ${errorCode}`
    )
  }

  if (!code) {
    console.log("[Google OAuth] Callback has code: false")
    throw new Error("Google no devolvió un código de autenticación")
  }

  console.log("[Google OAuth] Callback has code: true")
  if (!claimAuthCode(code)) return

  console.log("[Google OAuth] Exchanging PKCE code")

  const { data: exchangeData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    releaseAuthCode(code)
    console.log(
      "[Google OAuth] PKCE exchange error:",
      exchangeError.message
    )
    const { data } = await supabase.auth.getSession()
    if (data.session) return
    throw exchangeError
  }

  console.log("[Google OAuth] Session created", {
    hasSession: Boolean(exchangeData.session),
  })
}
