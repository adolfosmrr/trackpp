import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack"

import {
  MainTabsNavigator,
} from "./MainTabsNavigator"

import {
  CreateHouseholdScreen,
} from "../features/households/screens/CreateHouseholdScreen"

import {
  InvitationsScreen,
} from "../features/households/screens/InvitationsScreen"

import { InviteMemberScreen } from "../features/households/screens/InviteMemberScreen"
import { AiConversationScreen } from "../features/ai/screens/AiConversationScreen"
import { FixedExpenseHistoryScreen } from "../features/fixedExpenses/screens/FixedExpenseHistoryScreen"
import { PayFixedExpensePeriodScreen } from "../features/fixedExpenses/screens/PayFixedExpensePeriodScreen"
import { CorrectFixedExpensePaymentScreen } from "../features/fixedExpenses/screens/CorrectFixedExpensePaymentScreen"
import { PendingChargeScreen } from "../features/pendingCharges/screens/PendingChargeScreen"
import { PendingChargesScreen } from "../features/pendingCharges/screens/PendingChargesScreen"
import { BudgetEditorScreen } from "../features/budgets/screens/BudgetEditorScreen"
import { SelectSpaceScreen } from "../features/households/screens/SelectSpaceScreen"
import { ProfileScreen } from "../features/profile/screens/ProfileScreen"
import { CategoryPickerScreen } from "../features/transactions/screens/CategoryPickerScreen"
import { CreateMovementScreen } from "../features/transactions/screens/CreateMovementScreen"
import { HouseholdPickerScreen } from "../features/transactions/screens/HouseholdPickerScreen"
import { TransactionFiltersScreen } from "../features/transactions/screens/TransactionFiltersScreen"
import { colors } from "../theme"
import { formSheetOptions } from "./formSheet"
import type { AppStackParamList } from "./types"

const Stack =
  createNativeStackNavigator<AppStackParamList>()

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Main"
        component={
          MainTabsNavigator
        }
      />

      <Stack.Screen
        name="CreateHousehold"
        component={
          CreateHouseholdScreen
        }
        options={formSheetOptions("fitToContents")}
      />

      <Stack.Screen
        name="Invitations"
        component={InvitationsScreen}
        options={{
          title: "Invitaciones",
        }}
      />

      <Stack.Screen
        name="InviteMember"
        component={InviteMemberScreen}
        options={{
          title: "Invitar pareja",
        }}
      />

      <Stack.Screen
        name="AiConversation"
        component={AiConversationScreen}
        options={{ title: "Asistente" }}
      />

      <Stack.Screen
        name="FixedExpenseHistory"
        component={FixedExpenseHistoryScreen}
        options={{ title: "Historial" }}
      />
      <Stack.Screen
        name="PayFixedExpensePeriod"
        component={PayFixedExpensePeriodScreen}
        options={{ title: "Registrar pago parcial" }}
      />
      <Stack.Screen
        name="CorrectFixedExpensePayment"
        component={CorrectFixedExpensePaymentScreen}
        options={{ title: "Corregir pago" }}
      />
      <Stack.Screen
        name="PendingCharges"
        component={PendingChargesScreen}
        options={{ title: "Gastos de tarjeta" }}
      />
      <Stack.Screen
        name="PendingCharge"
        component={PendingChargeScreen}
        options={{ title: "Cargar gasto" }}
      />
      <Stack.Screen
        name="CreateMovement"
        component={CreateMovementScreen}
        options={formSheetOptions("fitToContents")}
      />
      <Stack.Screen
        name="CategoryPicker"
        component={CategoryPickerScreen}
        options={formSheetOptions("fitToContents")}
      />
      <Stack.Screen
        name="HouseholdPicker"
        component={HouseholdPickerScreen}
        options={formSheetOptions("fitToContents")}
      />
      <Stack.Screen
        name="TransactionFilters"
        component={TransactionFiltersScreen}
        options={formSheetOptions([0.72, 1])}
      />
      <Stack.Screen
        name="SelectSpace"
        component={SelectSpaceScreen}
        options={formSheetOptions("fitToContents")}
      />
      <Stack.Screen
        name="BudgetEditor"
        component={BudgetEditorScreen}
        options={formSheetOptions("fitToContents")}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={formSheetOptions([0.88], false)}
      />
    </Stack.Navigator>
  )
}
