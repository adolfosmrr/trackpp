import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { AuthScreen } from "../features/auth/screens/AuthScreen"
import { colors } from "../theme"

export type AuthStackParamList = {
  Auth: undefined
}

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
