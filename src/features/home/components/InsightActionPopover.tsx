import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"

import type { HomeAiInsightAction } from "../../dashboard/types/homeAiInsight"

export type InsightActionDetail =
  | {
      type: "fixed_expense_period"
      name: string
      status: string
      amount?: string
      dueDate?: string
    }
  | {
      type: "budget"
      categoryName: string
      percentage: number
      budgetAmount?: string
      spent?: string
    }
  | {
      type: "category"
      categoryName: string
      amount?: string
      period?: string
    }

export type InsightActionPopoverProps = {
  action: HomeAiInsightAction
  onClose: () => void
  detail?: InsightActionDetail
  style?: StyleProp<ViewStyle>
}

export function InsightActionPopover({
  action,
  onClose,
  detail,
  style,
}: InsightActionPopoverProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{action.label}</Text>
        <Pressable
          accessibilityLabel="Cerrar detalle del insight"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>x</Text>
        </Pressable>
      </View>

      {detail ? <DetailContent detail={detail} /> : (
        <Text style={styles.fallback}>
          Ver detalle relacionado con esta acción.
        </Text>
      )}
    </View>
  )
}

function DetailContent({ detail }: { detail: InsightActionDetail }) {
  if (detail.type === "fixed_expense_period") {
    return (
      <View>
        <Text style={styles.detail}>{detail.name}</Text>
        <Text style={styles.meta}>Estado: {detail.status}</Text>
        {detail.amount ? <Text style={styles.meta}>Monto: {detail.amount}</Text> : null}
        {detail.dueDate ? <Text style={styles.meta}>Vence: {detail.dueDate}</Text> : null}
      </View>
    )
  }

  if (detail.type === "budget") {
    return (
      <View>
        <Text style={styles.detail}>{detail.categoryName}</Text>
        <Text style={styles.meta}>Uso: {detail.percentage}%</Text>
        {detail.budgetAmount ? <Text style={styles.meta}>Presupuesto: {detail.budgetAmount}</Text> : null}
        {detail.spent ? <Text style={styles.meta}>Gasto actual: {detail.spent}</Text> : null}
      </View>
    )
  }

  return (
    <View>
      <Text style={styles.detail}>{detail.categoryName}</Text>
      {detail.amount ? <Text style={styles.meta}>Gasto: {detail.amount}</Text> : null}
      {detail.period ? <Text style={styles.meta}>Periodo: {detail.period}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    width: "100%",
    zIndex: 2,
    elevation: 2,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: "#1C1C1C",
    flex: 1,
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 14,
    lineHeight: 18,
  },
  closeButton: {
    marginLeft: 12,
  },
  closeText: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 16,
  },
  detail: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 14,
    lineHeight: 18,
    marginTop: 8,
  },
  meta: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 14,
    lineHeight: 18,
  },
  fallback: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 14,
    lineHeight: 18,
    marginTop: 8,
  },
})
