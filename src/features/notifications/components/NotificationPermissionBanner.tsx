import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Linking, StyleSheet, View } from "react-native"
import { colors, radii } from "../../../theme"
import { GlassButton } from "../../../components/buttons/GlassButton"
import { AppText } from "../../../components/text/AppText"
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
      <AppText variant="sectionTitle">Activa las notificaciones</AppText>
      <AppText tone="muted" variant="body">
        Recibe recordatorios de tus pagos y vencimientos.
      </AppText>
      <GlassButton
        accessibilityLabel={denied ? "Abrir configuración" : "Activar notificaciones"}
        label={requesting ? "Abriendo..." : denied ? "Abrir configuración" : "Activar notificaciones"}
        onPress={() => void handleRequest()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: "flex-start", gap: 8, padding: 12, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
})
