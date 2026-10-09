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
import { AiChatScreen } from "../features/ai/screens/AiChatScreen"
import { AiConversationScreen } from "../features/ai/screens/AiConversationScreen"
import { FixedExpensesScreen } from "../features/fixedExpenses/screens/FixedExpensesScreen"
import { CreateFixedExpenseScreen } from "../features/fixedExpenses/screens/CreateFixedExpenseScreen"
import { EditFixedExpenseScreen } from "../features/fixedExpenses/screens/EditFixedExpenseScreen"
import { PayFixedExpensePeriodScreen } from "../features/fixedExpenses/screens/PayFixedExpensePeriodScreen"
import { CorrectFixedExpensePaymentScreen } from "../features/fixedExpenses/screens/CorrectFixedExpensePaymentScreen"
import { CreateTransactionScreen } from "../features/transactions/screens/CreateTransactionScreen"
import { PendingChargeScreen } from "../features/pendingCharges/screens/PendingChargeScreen"
import { PendingChargesScreen } from "../features/pendingCharges/screens/PendingChargesScreen"
import { colors } from "../theme"

export type AppStackParamList = {
  Main: undefined
  CreateTransaction: undefined
  CreateHousehold: undefined
  InviteMember: undefined
  Invitations: undefined
  AiChat: undefined
  AiConversation: { conversationId?: string }
  FixedExpenses: undefined
  CreateFixedExpense: undefined
  EditFixedExpense: { fixedExpenseId: string }
  PayFixedExpensePeriod: { periodId: string }
  CorrectFixedExpensePayment: { paymentId: string }
  PendingCharges: undefined
  PendingCharge: { chargeId: string }
}

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
        name="CreateTransaction"
        component={CreateTransactionScreen}
        options={{ title: "Nueva transacción" }}
      />

      <Stack.Screen
        name="CreateHousehold"
        component={
          CreateHouseholdScreen
        }
        options={{
          title:
            "Nuevo espacio",
        }}
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
        name="AiChat"
        component={AiChatScreen}
        options={{
          title: "Asistente",
        }}
      />
      <Stack.Screen
        name="AiConversation"
        component={AiConversationScreen}
        options={{ title: "Asistente" }}
      />

      <Stack.Screen
        name="FixedExpenses"
        component={FixedExpensesScreen}
        options={{ title: "Gastos fijos" }}
      />
      <Stack.Screen
        name="CreateFixedExpense"
        component={CreateFixedExpenseScreen}
        options={{ title: "Nuevo gasto fijo" }}
      />
      <Stack.Screen
        name="EditFixedExpense"
        component={EditFixedExpenseScreen}
        options={{ title: "Editar gasto fijo" }}
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
    </Stack.Navigator>
  )
}
