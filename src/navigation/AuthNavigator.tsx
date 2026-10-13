import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { AuthScreen } from "../features/auth/screens/AuthScreen"
import { colors } from "../theme"
import type { AuthStackParamList } from "./types"

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  )
}
