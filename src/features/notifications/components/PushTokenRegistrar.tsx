import { useEffect } from "react"
import { AppState } from "react-native"
import { useQueryClient } from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"
import { syncExpoPushToken } from "../services/pushTokenService"

export function PushTokenRegistrar() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return

    const sync = () => {
      void syncExpoPushToken()
        .catch((error) => {
          if (__DEV__) {
            console.error("[Push] register error", error)
          }
        })
        .finally(() => {
          void queryClient.invalidateQueries({ queryKey: ["notification-permission"] })
        })
    }

    sync()
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") sync()
    })

    return () => subscription.remove()
  }, [queryClient, userId])

  return null
}
