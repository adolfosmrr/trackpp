import { ActivityIndicator, View, StyleSheet } from "react-native"
import { NavigationContainer } from "@react-navigation/native"

import { colors, navigationTheme } from "../theme"

import { AuthNavigator } from "./AuthNavigator"
import { AppNavigator } from "./AppNavigator"
import { useAuth } from "../features/auth/context/AuthContext"
import { navigationRef } from "./navigationRef"
import { flushPendingNotificationNavigation } from "../features/notifications/services/notificationNavigation"

export function RootNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={flushPendingNotificationNavigation}
    >
      {session ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
})
