import { View, StyleSheet } from "react-native"
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable"

import { HomeScreen } from "../features/home/screens/HomeScreen"
import { TransactionsScreen } from "../features/transactions/screens/TransactionsScreen"
import { AiChatScreen } from "../features/ai/screens/AiChatScreen"
import { BudgetsScreen } from "../features/budgets/screens/BudgetsScreen"
import { useHouseholds } from "../features/households/hooks/useHouseholds"
import { useHouseholdStore } from "../store/householdStore"
import { useActivityRealtime } from "../features/activity/hooks/useActivityRealtime"
import { useFixedExpenseNotificationSync } from "../features/fixedExpenses/hooks/useFixedExpenseNotificationSync"
import { usePendingCharges } from "../features/pendingCharges/hooks/usePendingCharges"
import { AddMovementButton } from "../components/navigation/AddMovementButton"
import {
    withMainTabsSwipe,
    type MainTabsParamList,
} from "./MainTabsSwipeContainer"
import { colors } from "../theme"

const SwipeHomeScreen = withMainTabsSwipe(HomeScreen)
const SwipeTransactionsScreen = withMainTabsSwipe(TransactionsScreen)
const SwipeAiChatScreen = withMainTabsSwipe(AiChatScreen)
const SwipeBudgetsScreen = withMainTabsSwipe(BudgetsScreen)

export type { MainTabsParamList } from "./MainTabsSwipeContainer"

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
    const pendingChargesQuery = usePendingCharges()
    const pendingCount = pendingChargesQuery.data?.length ?? 0

    return (
        <View style={styles.host}>
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: colors.mutedForeground,
                tabBarStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={SwipeHomeScreen}
                options={{
                    title: "Inicio",
                    tabBarIcon: ({ focused }) => ({
                        type: "sfSymbol",
                        name: focused ? "house.fill" : "house",
                    }),
                }}
            />

            <Tab.Screen
                name="Transactions"
                component={SwipeTransactionsScreen}
                options={{
                    title: "Movimientos",
                    tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
                    tabBarIcon: ({ focused }) => ({
                        type: "sfSymbol",
                        name: focused
                            ? "arrow.left.arrow.right.circle.fill"
                            : "arrow.left.arrow.right.circle",
                    }),
                }}
            />

            <Tab.Screen
                name="AiChat"
                component={SwipeAiChatScreen}
                options={{
                    title: "AI",
                    tabBarIcon: ({ focused }) => ({
                        type: "sfSymbol",
                        name: focused ? "sparkles" : "sparkles",
                    }),
                }}
            />

            <Tab.Screen
                name="Budgets"
                component={SwipeBudgetsScreen}
                options={{
                    title: "Presupuesto",
                    tabBarIcon: ({ focused }) => ({
                        type: "sfSymbol",
                        name: focused ? "chart.pie.fill" : "chart.pie",
                    }),
                }}
            />
        </Tab.Navigator>
        <AddMovementButton />
        </View>
    )
}

const styles = StyleSheet.create({
    host: {
        flex: 1,
    },
})
