import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { useFonts } from "expo-font"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { AuthProvider } from "./src/features/auth/context/AuthContext"
import { RootNavigator } from "./src/navigation/RootNavigator"
import { NotificationObserver } from "./src/features/notifications/components/NotificationObserver"
import { CreateTransactionSheetProvider } from "./src/features/transactions/components/CreateTransactionSheetProvider"
import "./src/features/notifications/services/notificationSetup"

const queryClient = new QueryClient()

export default function App() {
  const [fontsLoaded] = useFonts({
    "FamiljenGrotesk-Bold": require("./assets/fonts/FamiljenGrotesk-Bold.ttf"),
    "FamiljenGrotesk-Medium": require("./assets/fonts/FamiljenGrotesk-Medium.ttf"),
    "FamiljenGrotesk-Regular": require("./assets/fonts/FamiljenGrotesk-Regular.ttf"),
    "Satoshi-Bold": require("./assets/fonts/Satoshi-Bold.otf"),
    "Satoshi-Regular": require("./assets/fonts/Satoshi-Regular.otf"),
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BottomSheetModalProvider>
              <CreateTransactionSheetProvider>
                <NotificationObserver />
                <RootNavigator />
              </CreateTransactionSheetProvider>
            </BottomSheetModalProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
