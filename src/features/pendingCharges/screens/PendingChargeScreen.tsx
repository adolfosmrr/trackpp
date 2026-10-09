import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
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

    Alert.alert(
      "Descartar gasto",
      "No lo vamos a cargar en ningún espacio.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            void dismissMutation.mutateAsync(charge.id).then(
              () => navigation.goBack(),
              (error: unknown) => {
                Alert.alert("No se pudo descartar", errorText(error, "Probá de nuevo en un momento."))
              },
            )
          },
        },
      ],
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Volver</Text>
        </Pressable>

        {chargeQuery.isLoading ? (
          <ActivityIndicator color="#1C1C1C" style={styles.loader} />
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
    backgroundColor: "#F4F4F4",
    flex: 1,
  },
  content: {
    gap: 14,
    paddingHorizontal: 20,
  },
  back: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
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
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 32,
    lineHeight: 36,
  },
  amount: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 28,
    lineHeight: 32,
  },
  meta: {
    color: "#666666",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 16,
    lineHeight: 22,
  },
  messageBlock: {
    gap: 16,
  },
  message: {
    color: "#666666",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 16,
    lineHeight: 22,
  },
  field: {
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  fieldDisabled: {
    opacity: 0.45,
  },
  fieldLabel: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
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
    color: "#FFFFFF",
    flexShrink: 1,
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
    opacity: 0.5,
    textAlign: "right",
  },
  error: {
    color: "#B42318",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 999,
    marginTop: 8,
    padding: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: "center",
    padding: 12,
  },
  secondaryButtonText: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
})
