import { useEffect, useRef } from "react"
import * as Notifications from "expo-notifications"

import { useAuth } from "../../auth/context/AuthContext"
import { handleFixedExpenseNotificationResponse } from "../services/notificationNavigation"

export function NotificationObserver() {
  const { session } = useAuth()
  const handledIdentifiers = useRef(new Set<string>())

  useEffect(() => {
    if (!session) {
      return
    }

    const processResponse = (response: Notifications.NotificationResponse) => {
      const identifier = response.notification.request.identifier
      if (handledIdentifiers.current.has(identifier)) {
        return
      }

      handledIdentifiers.current.add(identifier)
      handleFixedExpenseNotificationResponse(response, session.user.id)
      void Notifications.clearLastNotificationResponseAsync()
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      processResponse
    )

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        processResponse(response)
        void Notifications.clearLastNotificationResponseAsync()
      }
    })

    return () => subscription.remove()
  }, [session])

  return null
}
