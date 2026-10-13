import { Platform } from "react-native"
import Constants from "expo-constants"
import * as Notifications from "expo-notifications"

import { supabase } from "../../../services/supabase"
import { ensureBankChargeNotificationChannel } from "./notificationChannels"
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from "./notificationPermissionService"

let registration: Promise<void> | null = null
let requestedPermissionThisSession = false

export function syncExpoPushToken() {
  if (registration) return registration
  registration = registerExpoPushToken().finally(() => {
    registration = null
  })
  return registration
}

async function registerExpoPushToken() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return

  await ensureBankChargeNotificationChannel()

  let permission = await getNotificationPermissionStatus()
  if (
    !permission.granted &&
    permission.status === Notifications.PermissionStatus.UNDETERMINED &&
    !requestedPermissionThisSession
  ) {
    requestedPermissionThisSession = true
    try {
      permission = await requestNotificationPermission()
    } catch (error) {
      requestedPermissionThisSession = false
      throw error
    }
  }

  if (!permission.granted) return

  const projectId = readExpoProjectId()
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  const { error } = await supabase.rpc("register_push_token", {
    p_expo_push_token: token,
    p_platform: Platform.OS,
  })

  if (error) {
    throw error
  }
}

function readExpoProjectId() {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: unknown } } | undefined
  const projectId = extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (typeof projectId !== "string" || projectId.length === 0) {
    throw new Error("No se encontró el projectId de EAS.")
  }
  return projectId
}
