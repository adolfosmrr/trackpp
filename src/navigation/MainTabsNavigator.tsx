import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable"

import { HomeScreen } from "../features/home/screens/HomeScreen"
import { TransactionsScreen } from "../features/transactions/screens/TransactionsScreen"
import { AiChatScreen } from "../features/ai/screens/AiChatScreen"
import { BudgetsScreen } from "../features/budgets/screens/BudgetsScreen"
import { ProfileScreen } from "../features/profile/screens/ProfileScreen"
import { useHouseholds } from "../features/households/hooks/useHouseholds"
import { useHouseholdStore } from "../store/householdStore"
import { useActivityRealtime } from "../features/activity/hooks/useActivityRealtime"
import { useFixedExpenseNotificationSync } from "../features/fixedExpenses/hooks/useFixedExpenseNotificationSync"

export type MainTabsParamList = {
    Home: undefined
    Transactions: undefined
    AiChat: undefined
    Budgets: undefined
    Profile: undefined
}

const Tab = createNativeBottomTabNavigator<MainTabsParamList>()

export function MainTabsNavigator() {
    const selectedHouseholdId = useHouseholdStore(
        (state) => state.selectedHouseholdId
    )
    const { data: memberships } = useHouseholds()
    const selectedHousehold = memberships?.find(
        (membership) => membership.household.id === selectedHouseholdId
    )?.household

    useActivityRealtime(selectedHousehold?.type === "couple")
    useFixedExpenseNotificationSync()

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: "Inicio",
                }}
            />

            <Tab.Screen
                name="Transactions"
                component={TransactionsScreen}
                options={{
                    title: "Movimientos",
                }}
            />

            <Tab.Screen
                name="AiChat"
                component={AiChatScreen}
                options={{
                    title: "AI",
                }}
            />

            <Tab.Screen
                name="Budgets"
                component={BudgetsScreen}
                options={{
                    title: "Presupuesto",
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: "Perfil",
                }}
            />
        </Tab.Navigator>
    )
}
