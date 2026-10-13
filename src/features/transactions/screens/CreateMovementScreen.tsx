import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import type { AppStackParamList } from "../../../navigation/types"
import { CreateTransactionForm } from "../components/CreateTransactionForm"

type CreateMovementScreenProps = NativeStackScreenProps<AppStackParamList, "CreateMovement">

export function CreateMovementScreen({ navigation, route }: CreateMovementScreenProps) {
  const request = route.params?.request
  if (!request) return null

  return (
    <SheetScaffold
      onClose={() => navigation.goBack()}
      title={request.kind === "edit-fixed" ? "Editar movimiento" : "Movimiento"}
    >
      <CreateTransactionForm navigation={navigation} request={request} route={route} />
    </SheetScaffold>
  )
}
