import { Platform } from "react-native"
import * as Notifications from "expo-notifications"

export const BANK_CHARGE_CHANNEL_ID = "bank-charges"

export async function ensureBankChargeNotificationChannel() {
  if (Platform.OS !== "android") return

  await Notifications.setNotificationChannelAsync(BANK_CHARGE_CHANNEL_ID, {
    name: "Gastos de tarjeta",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  })
}
