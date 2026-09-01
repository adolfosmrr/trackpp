import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { TransactionsScreen } from "../features/transactions/screens/TransactionsScreen"
import { FixedExpensesScreen } from "../features/fixedExpenses/screens/FixedExpensesScreen"
import { CreateFixedExpenseScreen } from "../features/fixedExpenses/screens/CreateFixedExpenseScreen"
import { EditFixedExpenseScreen } from "../features/fixedExpenses/screens/EditFixedExpenseScreen"
import { PayFixedExpensePeriodScreen } from "../features/fixedExpenses/screens/PayFixedExpensePeriodScreen"
import { CorrectFixedExpensePaymentScreen } from "../features/fixedExpenses/screens/CorrectFixedExpensePaymentScreen"

export type TransactionsStackParamList = {
  Transactions: undefined
  FixedExpenses: undefined
  CreateFixedExpense: undefined
  EditFixedExpense: { fixedExpenseId: string }
  PayFixedExpensePeriod: { periodId: string }
  CorrectFixedExpensePayment: { paymentId: string }
}

const Stack = createNativeStackNavigator<TransactionsStackParamList>()

export function TransactionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="FixedExpenses" component={FixedExpensesScreen} />
      <Stack.Screen name="CreateFixedExpense" component={CreateFixedExpenseScreen} />
      <Stack.Screen name="EditFixedExpense" component={EditFixedExpenseScreen} />
      <Stack.Screen name="PayFixedExpensePeriod" component={PayFixedExpensePeriodScreen} />
      <Stack.Screen
        name="CorrectFixedExpensePayment"
        component={CorrectFixedExpensePaymentScreen}
      />
    </Stack.Navigator>
  )
}
