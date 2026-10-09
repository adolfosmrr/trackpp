import { useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { usePendingCharges } from "../hooks/usePendingCharges"
import {
  chargeOrigin,
  chargeTitle,
  formatChargeAmount,
  formatChargeDate,
} from "../utils/pendingChargeFormat"

type PendingChargesScreenProps = {
  navigation: {
    goBack: () => void
    navigate: (screen: "PendingCharge", params: { chargeId: string }) => void
  }
}

export function PendingChargesScreen({ navigation }: PendingChargesScreenProps) {
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const chargesQuery = usePendingCharges()

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await chargesQuery.refetch()
    } finally {
      setRefreshing(false)
    }
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
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
        <Text style={styles.back}>Volver</Text>
      </Pressable>
      <Text style={styles.title}>Gastos de tarjeta</Text>
      <Text style={styles.lead}>
        Elegí en qué espacio y categoría cargar cada consumo.
      </Text>

      {chargesQuery.isLoading ? (
        <ActivityIndicator color="#1C1C1C" style={styles.loader} />
      ) : chargesQuery.isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No se pudieron cargar los gastos de tarjeta.</Text>
          <Pressable onPress={() => void chargesQuery.refetch()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : chargesQuery.data?.length ? (
        <View style={styles.list}>
          {chargesQuery.data.map((charge) => {
            const date = formatChargeDate(charge.charged_at)
            return (
              <Pressable
                key={charge.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate("PendingCharge", { chargeId: charge.id })}
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
            )
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>No tenés gastos de tarjeta pendientes.</Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F4F4F4",
    flex: 1,
  },
  content: {
    gap: 16,
    paddingHorizontal: 20,
  },
  back: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 16,
  },
  title: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 32,
    lineHeight: 36,
  },
  lead: {
    color: "#666666",
    fontFamily: "FamiljenGrotesk-Regular",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    gap: 8,
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
    color: "#1C1C1C",
    flex: 1,
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 18,
    lineHeight: 22,
  },
  amount: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 18,
    lineHeight: 22,
  },
  meta: {
    color: "#777777",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 14,
  },
  empty: {
    gap: 16,
  },
  emptyText: {
    color: "#666666",
    fontFamily: "FamiljenGrotesk-Regular",
    fontSize: 16,
    lineHeight: 22,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1C1C1C",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 15,
  },
})
