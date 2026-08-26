import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Linking, Pressable, StyleSheet, Text, View } from "react-native"
import * as Notifications from "expo-notifications"

import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from "../services/notificationPermissionService"

export function NotificationPermissionBanner() {
  const queryClient = useQueryClient()
  const [requesting, setRequesting] = useState(false)
  const { data: permission } = useQuery({
    queryKey: ["notification-permission"],
    queryFn: getNotificationPermissionStatus,
  })

  if (!permission || permission.granted) {
    return null
  }

  const denied = permission.status === Notifications.PermissionStatus.DENIED

  async function handleRequest() {
    if (requesting) return
    setRequesting(true)
    try {
      if (denied) {
        await Linking.openSettings()
      } else {
        await requestNotificationPermission()
      }
      await queryClient.invalidateQueries({
        queryKey: ["notification-permission"],
      })
    } catch (error) {
      if (__DEV__) {
        console.error("[Notifications] permission error", error)
      }
    } finally {
      setRequesting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activa las notificaciones</Text>
      <Text style={styles.description}>
        Recibe recordatorios de tus pagos y vencimientos.
      </Text>
      <Pressable style={styles.button} onPress={() => void handleRequest()}>
        <Text style={styles.buttonText}>
          {requesting ? "Abriendo..." : denied ? "Abrir configuración" : "Activar notificaciones"}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8, padding: 14, borderRadius: 12, backgroundColor: "#f5f5f5" },
  title: { fontWeight: "700" },
  description: { color: "#555" },
  button: { alignSelf: "flex-start", paddingVertical: 8 },
  buttonText: { fontWeight: "700" },
})
