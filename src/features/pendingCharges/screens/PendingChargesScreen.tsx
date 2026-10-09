import { useRef, useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useQueryClient } from "@tanstack/react-query"
import Swipeable from "react-native-gesture-handler/Swipeable"
import { colors, fonts, radii } from "../../../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BackLink } from "../../../components/navigation/BackLink"
import { EmptyState } from "../../../components/feedback/EmptyState"
import { showUndo } from "../../../components/feedback/undo"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"
import { navigationRef } from "../../../navigation/navigationRef"
import {
  invalidateHouseholdTransactionQueries,
  invalidatePendingCharges,
} from "../hooks/invalidateChargeQueries"
import { usePendingCharges } from "../hooks/usePendingCharges"
import { dismissPendingCharge } from "../services/pendingChargeService"
import { assignChargeToPersonal } from "../utils/quickAssign"
import {
  chargeOrigin,
  chargeTitle,
  formatChargeAmount,
  formatChargeDate,
} from "../utils/pendingChargeFormat"
import type { PendingBankCharge } from "../types"

type PendingChargesScreenProps = {
  navigation: {
    goBack: () => void
    navigate: (screen: "PendingCharge", params: { chargeId: string }) => void
  }
}

export function PendingChargesScreen({ navigation }: PendingChargesScreenProps) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const chargesQuery = usePendingCharges()
  const { data: memberships } = useHouseholds()
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await chargesQuery.refetch()
    } finally {
      setRefreshing(false)
    }
  }

  function restoreCharge(charge: PendingBankCharge) {
    queryClient.setQueriesData({ queryKey: ["pending-charges"] }, (current: unknown) => {
      if (!Array.isArray(current)) return current
      if (current.some((item) => item?.id === charge.id)) return current
      return [charge, ...current]
    })
  }

  function hideCharge(chargeId: string) {
    queryClient.setQueriesData({ queryKey: ["pending-charges"] }, (current: unknown) => {
      if (!Array.isArray(current)) return current
      return current.filter((item) => item?.id !== chargeId)
    })
  }

  async function assignCharge(charge: PendingBankCharge) {
    if (busyId) return
    setBusyId(charge.id)
    hideCharge(charge.id)
    try {
      const result = await assignChargeToPersonal({
        charge,
        memberships,
        selectedHouseholdId,
        queryClient,
      })
      invalidatePendingCharges(queryClient)
      invalidateHouseholdTransactionQueries(queryClient, result.householdId)
      showUndo({ message: "Lo cargaste en tu espacio Personal." })
    } catch (error) {
      restoreCharge(charge)
      showUndo({
        message: error instanceof Error ? error.message : "No se pudo cargar el gasto.",
      })
    } finally {
      setBusyId(null)
    }
  }

  function dismissCharge(charge: PendingBankCharge) {
    if (busyId) return
    hideCharge(charge.id)
    showUndo({
      message: "Descartaste el gasto",
      actionLabel: "Deshacer",
      onAction: () => restoreCharge(charge),
      onExpire: async () => {
        try {
          await dismissPendingCharge(charge.id)
          invalidatePendingCharges(queryClient)
        } catch (error) {
          restoreCharge(charge)
          showUndo({
            message: error instanceof Error ? error.message : "No se pudo descartar el gasto.",
          })
        }
      },
    })
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <BackLink onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Gastos de tarjeta</Text>
      <Text style={styles.lead}>
        Deslizá a la derecha para cargarlo en Personal, o a la izquierda para descartarlo.
      </Text>

      {chargesQuery.isLoading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : chargesQuery.isError ? (
        <EmptyState
          title="No se pudieron cargar"
          body="Probá de nuevo en un momento."
          actionLabel="Reintentar"
          onAction={() => {
            void chargesQuery.refetch()
          }}
        />
      ) : chargesQuery.data?.length ? (
        <View style={styles.list}>
          {chargesQuery.data.map((charge) => (
            <PendingChargeRow
              key={charge.id}
              charge={charge}
              onOpen={() => navigation.navigate("PendingCharge", { chargeId: charge.id })}
              onAssign={() => {
                void assignCharge(charge)
              }}
              onDismiss={() => dismissCharge(charge)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          title="No tenés gastos de tarjeta pendientes"
          body="Cuando llegue un consumo, lo vas a ver acá para cargarlo o descartarlo."
          actionLabel="Volver al inicio"
          onAction={() => {
            if (navigationRef.isReady()) navigationRef.navigate("Main")
            else navigation.goBack()
          }}
        />
      )}
    </ScrollView>
  )
}

function PendingChargeRow({
  charge,
  onOpen,
  onAssign,
  onDismiss,
}: {
  charge: PendingBankCharge
  onOpen: () => void
  onAssign: () => void
  onDismiss: () => void
}) {
  const swipeRef = useRef<Swipeable>(null)
  const date = formatChargeDate(charge.charged_at)

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <View style={[styles.action, styles.assignAction]}>
          <Text style={styles.actionText}>A Personal</Text>
        </View>
      )}
      renderRightActions={() => (
        <View style={[styles.action, styles.dismissAction]}>
          <Text style={styles.actionText}>Descartar</Text>
        </View>
      )}
      onSwipeableOpen={(direction) => {
        swipeRef.current?.close()
        if (direction === "left") onAssign()
        else onDismiss()
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Deslizá a la derecha para cargarlo en Personal o a la izquierda para descartarlo."
        onPress={onOpen}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.merchant}>{chargeTitle(charge)}</Text>
          <Text style={styles.amount}>
            {formatChargeAmount(charge.amount, charge.currency)}
          </Text>
        </View>
        <Text style={styles.meta}>
          {chargeOrigin(charge)}
          {date ? ` · ${date}` : ""}
        </Text>
      </Pressable>
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: 16,
    paddingHorizontal: 20,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    letterSpacing: -0.6,
    fontSize: 28,
    lineHeight: 36,
  },
  lead: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 22,
  },
  loader: {
    marginTop: 24,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 8,
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  merchant: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.sansSemibold,
    fontSize: 18,
    lineHeight: 22,
  },
  amount: {
    color: colors.foreground,
    fontFamily: fonts.monoSemibold,
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    alignItems: "center",
    borderRadius: radii.md,
    justifyContent: "center",
    marginVertical: 0,
    minWidth: 96,
    paddingHorizontal: 12,
  },
  assignAction: {
    backgroundColor: colors.brand,
    marginRight: 8,
  },
  dismissAction: {
    backgroundColor: colors.destructive,
    marginLeft: 8,
  },
  actionText: {
    color: colors.brandForeground,
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
  },
})
