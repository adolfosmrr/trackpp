import { useState } from "react"

import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  LayoutChangeEvent,
} from "react-native"

import { useBudgets } from "../hooks/useBudgets"
import { useCreateBudget } from "../hooks/useCreateBudget"
import { useUpdateBudget } from "../hooks/useUpdateBudget"
import { useDeleteBudget } from "../hooks/useDeleteBudget"

import { useCategories } from "../../categories/hooks/useCategories"

import type { BudgetWithProgress } from "../types"
import { useProfile } from "../../profile/hooks/useProfile"
import { useDashboard } from "../../dashboard/hooks/useDashboard"
import { ScreenContainer } from "../../../components/layout/ScreenContainer"
import { TopSection } from "../../../components/layout/TopSection"
import { TopSectionHeader } from "../../../components/layout/TopSectionHeader"
import { HomeBalance } from "../../home/components/HomeBalance"
import { HomeGreeting } from "../../home/components/HomeGreeting"
import { HomeIncomeExpenseSummary } from "../../home/components/HomeIncomeExpenseSummary"

export function BudgetsScreen() {
  const [topSectionHeight, setTopSectionHeight] = useState(0)
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile()
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useDashboard()
  const {
    data: budgets,
    isLoading: budgetsLoading,
    error: budgetsError,
  } = useBudgets()

  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useCategories("expense")

  const createBudgetMutation = useCreateBudget()
  const updateBudgetMutation = useUpdateBudget()
  const deleteBudgetMutation = useDeleteBudget()

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string | null>(null)

  const [amount, setAmount] = useState("")

  const [editingBudget, setEditingBudget] =
    useState<BudgetWithProgress | null>(null)

  const [editingAmount, setEditingAmount] =
    useState("")

  function handleTopSectionLayout(event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height
    setTopSectionHeight((current) => current || height)
  }

  async function handleCreateBudget() {
    if (!selectedCategoryId) {
      Alert.alert(
        "Error",
        "Selecciona una categoría."
      )
      return
    }

    const parsedAmount = Number(
      amount.replace(",", ".")
    )

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert(
        "Error",
        "Escribe un monto válido."
      )
      return
    }

    try {
      await createBudgetMutation.mutateAsync({
        categoryId: selectedCategoryId,
        amount: parsedAmount,
      })

      setSelectedCategoryId(null)
      setAmount("")
    } catch (error) {
      if (__DEV__) {
        console.error("[Budget] create error:", {
          message:
            error instanceof Error
              ? error.message
              : undefined,
        })
      }

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear el presupuesto."

      Alert.alert("Error", message)
    }
  }

  function handleEditBudget(
    budget: BudgetWithProgress
  ) {
    setEditingBudget(budget)
    setEditingAmount(
      String(budget.amount)
    )
  }

  async function handleSaveEdit() {
    if (!editingBudget) {
      return
    }

    const parsedAmount = Number(
      editingAmount.replace(",", ".")
    )

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert(
        "Error",
        "Escribe un monto válido."
      )
      return
    }

    try {
      await updateBudgetMutation.mutateAsync({
        budgetId: editingBudget.id,
        amount: parsedAmount,
      })

      setEditingBudget(null)
      setEditingAmount("")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el presupuesto."

      Alert.alert("Error", message)
    }
  }

  function handleDeleteBudget(
    budgetId: string
  ) {
    Alert.alert(
      "Eliminar presupuesto",
      "¿Seguro que quieres eliminar este presupuesto?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBudgetMutation.mutateAsync(
                budgetId
              )
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "No se pudo eliminar el presupuesto."

              Alert.alert(
                "Error",
                message
              )
            }
          },
        },
      ]
    )
  }

  if (
    budgetsLoading ||
    categoriesLoading ||
    profileLoading ||
    dashboardLoading
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (budgetsError || profileError || dashboardError) {
    return (
      <View style={styles.center}>
        <Text>
          No se pudieron cargar los presupuestos.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.screenWrapper}>
      <ScreenContainer paddingHorizontal={0}>
        <ScrollView
          style={[styles.container, !topSectionHeight && styles.hiddenList]}
          contentContainerStyle={styles.content}
        >
          <View style={{ height: topSectionHeight }} />
        <Text style={styles.title}>
          Presupuesto del mes
        </Text>

        <Text style={styles.label}>
          Categoría
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.categories
          }
        >
          {categories?.map(
            (category) => {
              const selected =
                selectedCategoryId ===
                category.id

              return (
                <Pressable
                  key={category.id}
                  style={[
                    styles.category,
                    selected &&
                      styles.categorySelected,
                  ]}
                  onPress={() =>
                    setSelectedCategoryId(
                      category.id
                    )
                  }
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {category.icon
                      ? `${category.icon} `
                      : ""}
                    {category.name}
                  </Text>
                </Pressable>
              )
            }
          )}
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder="Monto mensual"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Pressable
          style={[
            styles.button,
            createBudgetMutation.isPending &&
              styles.buttonDisabled,
          ]}
          onPress={handleCreateBudget}
          disabled={
            createBudgetMutation.isPending
          }
        >
          <Text style={styles.buttonText}>
            {createBudgetMutation.isPending
              ? "Guardando..."
              : "Crear presupuesto"}
          </Text>
        </Pressable>

        <View style={styles.list}>
          {budgets?.length ? (
            budgets.map((budget) => (
              <View
                key={budget.id}
                style={styles.card}
              >
                <View
                  style={
                    styles.cardHeader
                  }
                >
                  <Text
                    style={
                      styles.categoryName
                    }
                  >
                    {budget.category.icon ??
                      ""}{" "}
                    {budget.category.name}
                  </Text>

                  <Text
                    style={
                      styles.percentage
                    }
                  >
                    {formatPercentage(
                      budget.percentage
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.progressBackground
                  }
                >
                  <View
                    style={[
                      styles.progress,
                      {
                        width:
                          `${budget.progressPercentage}%`,
                      },
                    ]}
                  />
                </View>

                <View
                  style={styles.amountRow}
                >
                  <Text>
                    Gastado:{" "}
                    {formatCurrency(
                      budget.spent
                    )}
                  </Text>

                  <Text>
                    de{" "}
                    {formatCurrency(
                      budget.amount
                    )}
                  </Text>
                </View>

                <Text
                  style={styles.remaining}
                >
                  {budget.remaining >= 0
                    ? "Restante:"
                    : "Excedido:"}{" "}
                  {formatCurrency(
                    Math.abs(budget.remaining)
                  )}
                </Text>

                <View
                  style={styles.actions}
                >
                  <Pressable
                    onPress={() =>
                      handleEditBudget(
                        budget
                      )
                    }
                  >
                    <Text
                      style={
                        styles.editText
                      }
                    >
                      Editar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      handleDeleteBudget(
                        budget.id
                      )
                    }
                  >
                    <Text
                      style={
                        styles.deleteText
                      }
                    >
                      Eliminar
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>
              Todavía no tienes
              presupuestos este mes.
            </Text>
          )}
        </View>
        </ScrollView>
      </ScreenContainer>

      <Modal
        visible={!!editingBudget}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setEditingBudget(null)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.modalContent}
          >
            <Text
              style={styles.modalTitle}
            >
              Editar presupuesto
            </Text>

            <Text
              style={styles.modalCategory}
            >
              {editingBudget?.category
                .icon ?? ""}{" "}
              {editingBudget?.category
                .name ?? ""}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nuevo monto"
              keyboardType="decimal-pad"
              value={editingAmount}
              onChangeText={
                setEditingAmount
              }
            />

            <Pressable
              style={[
                styles.button,
                updateBudgetMutation.isPending &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSaveEdit}
              disabled={
                updateBudgetMutation.isPending
              }
            >
              <Text
                style={styles.buttonText}
              >
                {updateBudgetMutation.isPending
                  ? "Guardando..."
                  : "Guardar cambios"}
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.cancelButton
              }
              onPress={() => {
                setEditingBudget(null)
                setEditingAmount("")
              }}
            >
              <Text
                style={styles.cancelText}
              >
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TopSection
        mode="collapsed"
        overlay
        onLayout={handleTopSectionLayout}
        style={styles.topSectionOverlay}
        renderContent={(collapseProgress) => (
          <>
            <TopSectionHeader collapseProgress={collapseProgress} profile={profile} />
            <HomeGreeting displayName={profile?.name?.trim()} collapseProgress={collapseProgress} />
            <HomeBalance
              balance={dashboard?.balance ?? 0}
              collapseProgress={collapseProgress}
              isCollapsed
            />
            <HomeIncomeExpenseSummary
              collapseProgress={collapseProgress}
              expenses={dashboard?.expenses ?? 0}
              income={dashboard?.income ?? 0}
            />
          </>
        )}
      />
    </View>
  )
}

function formatCurrency(
  amount: number
) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
    }
  ).format(amount)
}

function formatPercentage(
  percentage: number
) {
  return `${new Intl.NumberFormat(
    "es-AR",
    {
      maximumFractionDigits: 0,
    }
  ).format(percentage)}%`
}

const styles =
  StyleSheet.create({
    screenWrapper: {
      flex: 1,
      position: "relative",
    },

    topSectionOverlay: {
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 10,
    },

    hiddenList: {
      opacity: 0,
    },

    container: {
      flex: 1,
    },

    content: {
      padding: 24,
      gap: 18,
      paddingBottom: 40,
    },

    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    title: {
      fontSize: 26,
      fontWeight: "700",
    },

    label: {
      fontSize: 16,
      fontWeight: "600",
    },

    categories: {
      gap: 10,
    },

    category: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 999,
    },

    categorySelected: {
      backgroundColor: "#111",
      borderColor: "#111",
    },

    categoryText: {
      fontWeight: "500",
    },

    categoryTextSelected: {
      color: "#fff",
    },

    input: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      padding: 14,
    },

    button: {
      backgroundColor: "#111",
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color: "#fff",
      fontWeight: "700",
    },

    list: {
      gap: 14,
      marginTop: 6,
    },

    card: {
      padding: 18,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 16,
      gap: 12,
    },

    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    categoryName: {
      fontSize: 16,
      fontWeight: "700",
    },

    percentage: {
      fontWeight: "700",
    },

    progressBackground: {
      height: 8,
      backgroundColor: "#eee",
      borderRadius: 999,
      overflow: "hidden",
    },

    progress: {
      height: "100%",
      backgroundColor: "#111",
    },

    amountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    remaining: {
      color: "#777",
    },

    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 20,
      marginTop: 4,
    },

    editText: {
      fontWeight: "600",
    },

    deleteText: {
      color: "#b42318",
      fontWeight: "600",
    },

    empty: {
      textAlign: "center",
      color: "#777",
      paddingVertical: 30,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0, 0, 0, 0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },

    modalContent: {
      width: "100%",
      backgroundColor: "#fff",
      borderRadius: 18,
      padding: 20,
      gap: 16,
    },

    modalTitle: {
      fontSize: 22,
      fontWeight: "700",
    },

    modalCategory: {
      fontSize: 16,
      color: "#777",
    },

    cancelButton: {
      padding: 14,
      alignItems: "center",
    },

    cancelText: {
      fontWeight: "600",
      color: "#777",
    },
  })
