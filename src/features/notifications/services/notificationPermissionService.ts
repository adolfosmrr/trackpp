import { Platform } from "react-native"
import * as Notifications from "expo-notifications"

export async function getNotificationPermissionStatus() {
  const settings = await Notifications.getPermissionsAsync()
  return {
    granted: isGranted(settings),
    status: settings.status,
  }
}

export async function requestNotificationPermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "fixed-expense-reminders",
      {
        name: "Recordatorios de gastos",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      }
    )
  }

  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  })

  return {
    granted: isGranted(settings),
    status: settings.status,
  }
}

function isGranted(settings: Notifications.NotificationPermissionsStatus) {
  return settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
}
