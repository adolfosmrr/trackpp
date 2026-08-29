import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native"
  import { useState } from "react"

  import { useAuth } from "../../auth/context/AuthContext"
  import { useHouseholds } from "../../households/hooks/useHouseholds"
  import { useHouseholdStore } from "../../../store/householdStore"
  import { useTransactions } from "../hooks/useTransactions"
  import { useDeleteTransaction } from "../hooks/useDeleteTransaction"
  import type { Transaction } from "../types"

  export function TransactionsScreen({ navigation }: any) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const deleteMutation = useDeleteTransaction()

    const { user } = useAuth()
    const selectedHouseholdId = useHouseholdStore(
      (state) => state.selectedHouseholdId
    )
    const { data: memberships } = useHouseholds()
    const currentHousehold = memberships?.find(
      (membership) => membership.household.id === selectedHouseholdId
    )?.household

    const {
      data: transactions,
      isLoading,
      error,
    } = useTransactions()

    function confirmDelete(transaction: Transaction) {
      Alert.alert(
        "¿Eliminar movimiento?",
        `Esta acción eliminará "${transaction.title}".`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              void handleDelete(transaction.id)
            },
          },
        ]
      )
    }

    async function handleDelete(transactionId: string) {
      if (deletingId) {
        return
      }

      setDeletingId(transactionId)

      try {
        await deleteMutation.mutateAsync(transactionId)
      } catch (error) {
        if (__DEV__) {
          console.error("Delete transaction error:", error)
        }

        Alert.alert(
          "Error",
          isFixedExpenseDeleteError(error)
            ? "Este movimiento pertenece a un gasto fijo y debe gestionarse desde Gastos fijos."
            : error instanceof Error
              ? error.message
              : "No se pudo eliminar el movimiento."
        )
      } finally {
        setDeletingId(null)
      }
    }

    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      )
    }
  
    if (error) {
      return (
        <View style={styles.center}>
          <Text>No se pudieron cargar los movimientos.</Text>
        </View>
      )
    }
  
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate("CreateTransaction")}
        >
          <Text style={styles.buttonText}>
            Agregar movimiento
          </Text>
        </Pressable>
  
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Todavía no hay movimientos.
            </Text>
          }
           renderItem={({ item }) => (
               <View style={styles.transaction}>
               <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>
                  {item.title}
                </Text>

                <Text style={styles.transactionDate}>
                  {formatTransactionDate(item.transaction_date)}
                </Text>

                 <Text style={styles.transactionMeta}>
                   {item.category
                     ? `${item.category.icon ?? ""} ${item.category.name}`
                     : "Sin categoría"}
                   {item.fixedExpensePayment ? " · Gasto fijo" : ""}
                 </Text>

                {currentHousehold?.type === "couple" && (
                  <Text style={styles.transactionAuthor}>
                    Por {item.created_by === user?.id
                      ? "ti"
                      : item.creator?.name ?? "otro miembro"}
                   </Text>
                 )}
              </View>
  
              <View style={styles.transactionActions}>
                <Text
                  style={[
                    styles.amount,
                    item.type === "expense"
                      ? styles.expense
                      : styles.income,
                  ]}
                >
                  {item.type === "expense" ? "-" : "+"}
                  ${Number(item.amount).toLocaleString("es-AR")}
                </Text>

                {!item.fixedExpensePayment ? (
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(item)}
                    disabled={deletingId !== null}
                  >
                    <Text style={styles.deleteButtonText}>
                      {deletingId === item.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
             </View>
           )}
        />
      </View>
    )
  }

  function isFixedExpenseDeleteError(error: unknown) {
    return error instanceof Error && error.message.includes("FIXED_EXPENSE_TRANSACTION_CANNOT_BE_DELETED")
  }

  function formatTransactionDate(date: string) {
    const dateValue = date.length === 10 ? `${date}T00:00:00` : date
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(new Date(dateValue))
      .replace(/Sept/g, "Sep")
      .replace(/,/g, "")
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
  
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  
    button: {
      backgroundColor: "#111",
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
    },
  
    buttonText: {
      color: "#fff",
      fontWeight: "600",
    },
  
    list: {
      paddingTop: 20,
      gap: 12,
    },
  
    transaction: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
    },

    transactionInfo: {
      flex: 1,
    },

    transactionActions: {
      alignItems: "flex-end",
      gap: 8,
    },
  
    transactionTitle: {
      fontSize: 16,
      fontWeight: "600",
    },

    transactionDate: {
      color: "#777",
      fontSize: 12,
      marginTop: 2,
    },
  
    transactionMeta: {
      marginTop: 4,
      color: "#777",
    },

    transactionAuthor: {
      marginTop: 4,
      color: "#777",
    },
  
    amount: {
      fontSize: 16,
      fontWeight: "700",
    },
  
    expense: {
      color: "#b42318",
    },
  
    income: {
      color: "#067647",
    },

    deleteButton: {
      paddingVertical: 4,
      paddingHorizontal: 6,
    },

    deleteButtonText: {
      color: "#b42318",
      fontSize: 12,
      fontWeight: "600",
    },
  
    empty: {
      textAlign: "center",
      marginTop: 40,
      color: "#777",
    },
  })
