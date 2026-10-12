import { ScrollView } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import type { AppStackParamList } from "../../../navigation/types"
import { CreateTransactionForm } from "../components/CreateTransactionForm"

type CreateMovementScreenProps = NativeStackScreenProps<AppStackParamList, "CreateMovement">

export function CreateMovementScreen({ navigation, route }: CreateMovementScreenProps) {
  const insets = useSafeAreaInsets()
  const request = route.params?.request
  if (!request) return null

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <CreateTransactionForm navigation={navigation} request={request} route={route} />
    </ScrollView>
  )
}
