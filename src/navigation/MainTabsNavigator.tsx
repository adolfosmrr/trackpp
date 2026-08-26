import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Pressable, Text, View } from "react-native"

import { HomeScreen } from "../features/home/screens/HomeScreen"
import { TransactionsScreen } from "../features/transactions/screens/TransactionsScreen"
import { CreateTransactionScreen } from "../features/transactions/screens/CreateTransactionScreen"
import { BudgetsScreen } from "../features/budgets/screens/BudgetsScreen"
import { ProfileScreen } from "../features/profile/screens/ProfileScreen"
import { useHouseholds } from "../features/households/hooks/useHouseholds"
import { useHouseholdStore } from "../store/householdStore"
import { useActivityRealtime } from "../features/activity/hooks/useActivityRealtime"
import { useFixedExpenseNotificationSync } from "../features/fixedExpenses/hooks/useFixedExpenseNotificationSync"

export type MainTabsParamList = {
    Home: undefined
    Transactions: undefined
    CreateTransaction: undefined
    Budgets: undefined
    Profile: undefined
}

const Tab = createBottomTabNavigator<MainTabsParamList>()

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
                name="CreateTransaction"
                component={CreateTransactionScreen}
                options={{
                    title: "",
                    tabBarLabel: "",
                    tabBarButton: ({ onPress, accessibilityState }) => {
                        const selected = accessibilityState?.selected

                        return (
                            <Pressable
                                onPress={onPress}
                                style={{
                                    flex: 1,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <View
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 28,
                                        backgroundColor: "#111",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transform: [{ translateY: -10 }],
                                        opacity: selected ? 0.9 : 1,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: "#fff",
                                            fontSize: 30,
                                            lineHeight: 32,
                                            fontWeight: "400",
                                        }}
                                    >
                                        +
                                    </Text>
                                </View>
                            </Pressable>
                        )
                    },
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
