import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { AuthScreen } from "../features/auth/screens/AuthScreen"

export type AuthStackParamList = {
  Auth: undefined
}

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  )
}
