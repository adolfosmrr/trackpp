import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { BackLink } from "../../../components/navigation/BackLink"
import { showUndo } from "../../../components/feedback/undo"
import { colors, fonts, radii } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BottomSheetModal } from "@gorhom/bottom-sheet"

import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { useHouseholdCategories } from "../../categories/hooks/useHouseholdCategories"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { CategorySelectorSheet } from "../../transactions/components/CategorySelectorSheet"
import { HouseholdSelectorSheet } from "../../transactions/components/HouseholdSelectorSheet"
import { useHouseholdStore } from "../../../store/householdStore"
import { useAssignPendingCharge } from "../hooks/useAssignPendingCharge"
import { useDismissPendingCharge } from "../hooks/useDismissPendingCharge"
import { usePendingCharge } from "../hooks/usePendingCharge"
import {
  chargeOrigin,
  chargeTitle,
  currenciesMatch,
  formatChargeAmount,
  formatChargeDate,
} from "../utils/pendingChargeFormat"

import type { Category } from "../../categories/types"

type PendingChargeScreenProps = {
  navigation: { goBack: () => void }
  route: { params?: { chargeId?: string } }
}

export function PendingChargeScreen({ navigation, route }: PendingChargeScreenProps) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const chargeId = typeof route.params?.chargeId === "string" ? route.params.chargeId : null
  const chargeQuery = usePendingCharge(chargeId)
  const { data: memberships } = useHouseholds()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const assignMutation = useAssignPendingCharge()
  const dismissMutation = useDismissPendingCharge()
  const householdSheetRef = useRef<BottomSheetModal>(null)
  const categorySheetRef = useRef<BottomSheetModal>(null)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const charge = chargeQuery.data
  const categoriesQuery = useHouseholdCategories(
    householdId,
    "expense",
    Boolean(householdId) && charge?.status === "pending",
  )
  const selectedMembership = memberships?.find(
    (membership) => membership.household.id === householdId,
  )
  const currencyMatches = charge
    ? currenciesMatch(selectedMembership?.household.currency, charge.currency)
    : true
  const isPending = charge?.status === "pending"
  const isSaving = assignMutation.isPending || dismissMutation.isPending

  useEffect(() => {
    if (!charge || charge.status !== "pending" || householdId || !memberships?.length) {
      return
    }

    const compatible = memberships.filter((membership) =>
      currenciesMatch(membership.household.currency, charge.currency),
    )
    const preferred = compatible.find(
      (membership) => membership.household.id === selectedHouseholdId,
    ) ?? compatible[0]

    if (preferred) {
      setHouseholdId(preferred.household.id)
    }
  }, [charge, householdId, memberships, selectedHouseholdId])

  async function handleAssign() {
    if (!charge || !householdId || !category || !currencyMatches || isSaving) return

    try {
      await assignMutation.mutateAsync({
        chargeId: charge.id,
        householdId,
        categoryId: category.id,
      })
      navigation.goBack()
    } catch (error) {
      Alert.alert("No se pudo cargar", errorText(error, "Probá de nuevo en un momento."))
    }
  }

  function handleDismiss() {
    if (!charge || isSaving) return
    const dismissed = charge
    queryClient.setQueriesData({ queryKey: ["pending-charges"] }, (current: unknown) => {
      if (!Array.isArray(current)) return current
      return current.filter((item) => item?.id !== dismissed.id)
    })
    const restore = () => {
      queryClient.setQueriesData({ queryKey: ["pending-charges"] }, (current: unknown) => {
        if (!Array.isArray(current)) return current
        if (current.some((item) => item?.id === dismissed.id)) return current
        return [dismissed, ...current]
      })
    }
    navigation.goBack()
    showUndo({
      message: "Descartaste el gasto",
      actionLabel: "Deshacer",
      onAction: restore,
      onExpire: async () => {
        try {
          await dismissMutation.mutateAsync(dismissed.id)
        } catch (error) {
          restore()
          showUndo({
            message: errorText(error, "No se pudo descartar el gasto."),
          })
        }
      },
    })
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <BackLink onPress={() => navigation.goBack()} />

        {chargeQuery.isLoading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : chargeQuery.isError ? (
          <View style={styles.messageBlock}>
            <Text style={styles.message}>No se pudo cargar este gasto.</Text>
            <Pressable onPress={() => void chargeQuery.refetch()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : !charge ? (
          <Text style={styles.message}>No encontramos ese gasto.</Text>
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.merchant}>{chargeTitle(charge)}</Text>
              <Text style={styles.amount}>
                {formatChargeAmount(charge.amount, charge.currency)}
              </Text>
              <Text style={styles.meta}>
                {chargeOrigin(charge)}
                {formatChargeDate(charge.charged_at)
                  ? ` · ${formatChargeDate(charge.charged_at)}`
                  : ""}
              </Text>
            </View>

            {charge.status === "assigned" ? (
              <Text style={styles.message}>Este gasto ya está cargado en un espacio.</Text>
            ) : charge.status === "dismissed" ? (
              <Text style={styles.message}>Descartaste este gasto.</Text>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => householdSheetRef.current?.present()}
                  style={styles.field}
                >
                  <Text style={styles.fieldLabel}>Espacio</Text>
                  <View style={styles.fieldValueGroup}>
                    <Text numberOfLines={1} style={styles.fieldValue}>
                      {selectedMembership?.household.name ?? "Elegir"}
                    </Text>
                    <FieldChevronIcon />
                  </View>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={!householdId}
                  onPress={() => categorySheetRef.current?.present()}
                  style={[styles.field, !householdId && styles.fieldDisabled]}
                >
                  <Text style={styles.fieldLabel}>Categoría</Text>
                  <View style={styles.fieldValueGroup}>
                    <Text numberOfLines={1} style={styles.fieldValue}>
                      {category ? `${category.icon ? `${category.icon} ` : ""}${category.name}` : "Elegir"}
                    </Text>
                    <FieldChevronIcon />
                  </View>
                </Pressable>

                {memberships && memberships.length === 0 ? (
                  <Text style={styles.error}>No tenés espacios para cargar este gasto.</Text>
                ) : null}
                {householdId && !currencyMatches ? (
                  <Text style={styles.error}>
                    La moneda del gasto ({charge.currency}) no coincide con la del espacio (
                    {selectedMembership?.household.currency ?? "ARS"}).
                  </Text>
                ) : null}
                {householdId && categoriesQuery.isSuccess && categoriesQuery.data.length === 0 ? (
                  <Text style={styles.error}>Este espacio no tiene categorías de gasto.</Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={!householdId || !category || !currencyMatches || isSaving || !isPending}
                  onPress={() => void handleAssign()}
                  style={[
                    styles.primaryButton,
                    (!householdId || !category || !currencyMatches || isSaving) && styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {assignMutation.isPending ? "Cargando..." : "Cargar gasto"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  onPress={handleDismiss}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>
                    {dismissMutation.isPending ? "Descartando..." : "Descartar"}
                  </Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>

      <HouseholdSelectorSheet
        ref={householdSheetRef}
        memberships={memberships ?? []}
        onChange={(householdIds) => {
          const nextHouseholdId = householdIds[0] ?? null
          setHouseholdId(nextHouseholdId)
          if (nextHouseholdId !== householdId) {
            setCategory(null)
          }
        }}
        onDone={() => householdSheetRef.current?.dismiss()}
        selectedHouseholdIds={householdId ? [householdId] : []}
        selectionMode="single"
        title="Espacio"
      />
      <CategorySelectorSheet
        ref={categorySheetRef}
        categories={categoriesQuery.data}
        hasError={categoriesQuery.isError}
        householdName={selectedMembership?.household.name ?? ""}
        isLoading={categoriesQuery.isLoading}
        onSelect={(nextCategory) => {
          setCategory(nextCategory)
          categorySheetRef.current?.dismiss()
        }}
        selectedCategoryId={category?.id ?? null}
      />
    </View>
  )
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: 14,
    paddingHorizontal: 20,
  },
  back: {
    color: colors.brand,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
  },
  loader: {
    marginTop: 32,
  },
  summary: {
    gap: 6,
    marginBottom: 8,
  },
  merchant: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    letterSpacing: -0.6,
    fontSize: 28,
    lineHeight: 36,
  },
  amount: {
    color: colors.foreground,
    fontFamily: fonts.monoSemibold,
    fontSize: 24,
    lineHeight: 32,
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 22,
  },
  messageBlock: {
    gap: 16,
  },
  message: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 22,
  },
  field: {
    alignItems: "center",
    backgroundColor: colors.field,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  fieldDisabled: {
    opacity: 0.45,
  },
  fieldLabel: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 18,
  },
  fieldValueGroup: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginLeft: 12,
    minWidth: 0,
  },
  fieldValue: {
    color: colors.mutedForeground,
    flexShrink: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 18,
    textAlign: "right",
  },
  error: {
    color: colors.destructive,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.sm,
    marginTop: 8,
    padding: 16,
  },
  primaryButtonText: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: "center",
    padding: 12,
  },
  secondaryButtonText: {
    color: colors.mutedForeground,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
})
