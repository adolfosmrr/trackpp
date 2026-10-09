import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { useFonts } from "expo-font"
import { StatusBar } from "expo-status-bar"
import { StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { AuthProvider } from "./src/features/auth/context/AuthContext"
import { RootNavigator } from "./src/navigation/RootNavigator"
import { NotificationObserver } from "./src/features/notifications/components/NotificationObserver"
import { PushTokenRegistrar } from "./src/features/notifications/components/PushTokenRegistrar"
import { CreateTransactionSheetProvider } from "./src/features/transactions/components/CreateTransactionSheetProvider"
import { ProfileMenuSheet } from "./src/features/profile/components/ProfileMenuSheet"
import { UndoSnackbar } from "./src/components/feedback/UndoSnackbar"
import { colors } from "./src/theme"
import "./src/features/notifications/services/notificationSetup"

const queryClient = new QueryClient()

export default function App() {
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("./assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("./assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
    "SourceCodePro-Regular": require("./assets/fonts/SourceCodePro-Regular.ttf"),
    "SourceCodePro-Medium": require("./assets/fonts/SourceCodePro-Medium.ttf"),
    "SourceCodePro-Semibold": require("./assets/fonts/SourceCodePro-Semibold.ttf"),
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BottomSheetModalProvider>
              <CreateTransactionSheetProvider>
                <NotificationObserver />
                <PushTokenRegistrar />
                <RootNavigator />
                <ProfileMenuSheet />
                <UndoSnackbar />
              </CreateTransactionSheetProvider>
            </BottomSheetModalProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
})
