import { Alert, Linking } from "react-native"

import { supabase } from "../../../services/supabase"
import { authErrorMessage } from "./authErrors"

export const AUTH_REDIRECT_URL = "gastosapp://auth/callback"

const claimedCodes = new Set<string>()
const recoveryListeners = new Set<() => void>()

export function onPasswordRecovery(listener: () => void) {
  recoveryListeners.add(listener)
  return () => {
    recoveryListeners.delete(listener)
  }
}

export function getCallbackParam(url: URL, name: string) {
  const queryValue = url.searchParams.get(name)
  if (queryValue) return queryValue

  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash
  return new URLSearchParams(hash).get(name)
}

export function claimAuthCode(code: string) {
  if (claimedCodes.has(code)) return false
  claimedCodes.add(code)
  return true
}

export function releaseAuthCode(code: string) {
  claimedCodes.delete(code)
}

export function subscribeToAuthCallback() {
  const subscription = Linking.addEventListener("url", (event) => {
    void completeAuthCallback(event.url)
  })

  void Linking.getInitialURL().then((url) => {
    if (url) void completeAuthCallback(url)
  })

  return () => subscription.remove()
}

async function completeAuthCallback(url: string) {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return
  }

  if (parsed.protocol !== "gastosapp:" || parsed.host !== "auth") return

  const errorCode = getCallbackParam(parsed, "error")
  const errorDescription = getCallbackParam(parsed, "error_description")
  if (errorCode || errorDescription) {
    Alert.alert("Error", authErrorMessage(new Error(errorDescription || errorCode || "")))
    return
  }

  const code = getCallbackParam(parsed, "code")
  if (!code || !claimAuthCode(code)) return
  const isRecovery = getCallbackParam(parsed, "type") === "recovery"

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (!error) {
    if (isRecovery) recoveryListeners.forEach((listener) => listener())
    return
  }

  releaseAuthCode(code)
  const { data } = await supabase.auth.getSession()
  if (data.session) return
  Alert.alert("Error", authErrorMessage(error))
}
