import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button } from "../../../components/buttons/Button"
import { BackLink } from "../../../components/navigation/BackLink"
import { showUndo } from "../../../components/feedback/undo"
import { colors, fonts, layout, radii } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { useHouseholdCategories } from "../../categories/hooks/useHouseholdCategories"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { FieldRow } from "../../../components/inputs/TextField"
import type { AppStackParamList } from "../../../navigation/types"
import { useHouseholdStore } from "../../../store/householdStore"
import { formatPeriodLabel } from "../../fixedExpenses/utils/frequency"
import { formatMoney } from "../../../utils/formatMoney"
import { useAssignPendingCharge } from "../hooks/useAssignPendingCharge"
import { useDismissPendingCharge } from "../hooks/useDismissPendingCharge"
import { useLinkPendingCharge } from "../hooks/useLinkPendingCharge"
import { usePendingCharge } from "../hooks/usePendingCharge"
import { usePendingChargeSuggestion } from "../hooks/usePendingChargeSuggestion"
import {
  chargeOrigin,
  chargeTitle,
  currenciesMatch,
  formatChargeAmount,
  formatChargeDate,
} from "../utils/pendingChargeFormat"

type ChargeCategory = {
  id: string
  name: string
  icon: string | null
}

type PendingChargeScreenProps = NativeStackScreenProps<AppStackParamList, "PendingCharge">

export function PendingChargeScreen({ navigation, route }: PendingChargeScreenProps) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const chargeId = route.params.chargeId
  const chargeQuery = usePendingCharge(chargeId)
  const { data: memberships } = useHouseholds()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const assignMutation = useAssignPendingCharge()
  const dismissMutation = useDismissPendingCharge()
  const linkMutation = useLinkPendingCharge()
  const suggestionQuery = usePendingChargeSuggestion(
    chargeId,
    Boolean(chargeQuery.data?.suggestedPeriodId) && chargeQuery.data?.status === "pending",
  )
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [category, setCategory] = useState<ChargeCategory | null>(null)
  const householdIdRef = useRef(householdId)
  householdIdRef.current = householdId
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
  const suggestion = suggestionQuery.data
  const isSaving = assignMutation.isPending || dismissMutation.isPending || linkMutation.isPending

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

  useEffect(() => {
    const selection = route.params.householdSelection
    if (!selection) return
    const next = selection.householdIds[0] ?? null
    if (next !== householdIdRef.current) {
      setHouseholdId(next)
      setCategory(null)
    }
    navigation.setParams({ householdSelection: undefined })
  }, [navigation, route.params.householdSelection])

  useEffect(() => {
    const selection = route.params.categorySelection
    if (!selection) return
    if (selection.householdId === householdIdRef.current) {
      setCategory({
        id: selection.categoryId,
        name: selection.name,
        icon: selection.icon,
      })
    }
    navigation.setParams({ categorySelection: undefined })
  }, [navigation, route.params.categorySelection])

  async function handleLink() {
    if (!charge || !suggestion || isSaving) return

    try {
      await linkMutation.mutateAsync({
        chargeId: charge.id,
        periodId: suggestion.periodId,
      })
      navigation.goBack()
    } catch (error) {
      Alert.alert("No se pudo vincular", errorText(error, "Probá de nuevo en un momento."))
    }
  }

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

  async function handleDismiss() {
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

    try {
      await dismissMutation.mutateAsync(dismissed.id)
      navigation.goBack()
      showUndo({ message: "Descartaste el gasto" })
    } catch (error) {
      restore()
      showUndo({ message: errorText(error, "No se pudo descartar el gasto.") })
    }
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
            <Button label="Reintentar" onPress={() => void chargeQuery.refetch()} tone="brand" />
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
                {charge.suggestedPeriodId && suggestionQuery.isLoading ? (
                  <ActivityIndicator color={colors.brand} />
                ) : null}
                {charge.suggestedPeriodId && suggestionQuery.isError ? (
                  <Text style={styles.error}>
                    No pudimos revisar si este gasto coincide con un débito automático.
                  </Text>
                ) : null}
                {suggestion ? (
                  <View style={styles.suggestion}>
                    <Text style={styles.suggestionTitle}>Posible débito automático</Text>
                    <Text style={styles.message}>
                      {suggestion.name} · {formatPeriodLabel(suggestion.period)}. Esperado{" "}
                      {formatMoney(suggestion.expectedAmount, suggestionCurrency(memberships, suggestion.householdId))}, pendiente{" "}
                      {formatMoney(suggestion.remaining, suggestionCurrency(memberships, suggestion.householdId))}. Confirmá para registrarlo como pago de ese gasto fijo.
                    </Text>
                    <Button
                      accessibilityLabel={`Vincular con ${suggestion.name}`}
                      disabled={isSaving}
                      label={linkMutation.isPending ? "Vinculando..." : "Vincular al gasto fijo"}
                      onPress={() => void handleLink()}
                      tone="brand"
                    />
                  </View>
                ) : null}

                <FieldRow
                  onPress={() => {
                    navigation.navigate("HouseholdPicker", {
                      returnTo: "PendingCharge",
                      chargeId,
                      selectedHouseholdIds: householdId ? [householdId] : [],
                      selectionMode: "single",
                      title: "Espacio",
                    })
                  }}
                >
                  <Text style={styles.fieldLabel}>Espacio</Text>
                  <View style={styles.fieldValueGroup}>
                    <Text numberOfLines={1} style={styles.fieldValue}>
                      {selectedMembership?.household.name ?? "Elegir"}
                    </Text>
                    <FieldChevronIcon />
                  </View>
                </FieldRow>

                <FieldRow
                  disabled={!householdId}
                  onPress={() => {
                    if (!householdId) return
                    navigation.navigate("CategoryPicker", {
                      returnTo: "PendingCharge",
                      chargeId,
                      householdId,
                      householdName: selectedMembership?.household.name ?? "",
                      entryType: "expense",
                      selectedCategoryId: category?.id ?? null,
                    })
                  }}
                  style={!householdId ? styles.fieldDisabled : undefined}
                >
                  <Text style={styles.fieldLabel}>Categoría</Text>
                  <View style={styles.fieldValueGroup}>
                    <Text numberOfLines={1} style={styles.fieldValue}>
                      {category ? `${category.icon ? `${category.icon} ` : ""}${category.name}` : "Elegir"}
                    </Text>
                    <FieldChevronIcon />
                  </View>
                </FieldRow>

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

                <Button
                  disabled={!householdId || !category || !currencyMatches || isSaving || !isPending}
                  label={
                    assignMutation.isPending
                      ? "Cargando..."
                      : suggestion
                        ? "Cargarlo como gasto común"
                        : "Cargar gasto"
                  }
                  onPress={() => void handleAssign()}
                  tone={suggestion ? "ghost" : "brand"}
                />
                <Button
                  disabled={isSaving}
                  label={dismissMutation.isPending ? "Descartando..." : "Descartar"}
                  onPress={handleDismiss}
                  tone="ghost"
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function suggestionCurrency(
  memberships: { household: { id: string; currency: string } }[] | undefined,
  householdId: string,
) {
  return memberships?.find((membership) => membership.household.id === householdId)
    ?.household.currency ?? "ARS"
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
    paddingHorizontal: layout.sectionInset,
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
  suggestion: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  suggestionTitle: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 22,
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
})
