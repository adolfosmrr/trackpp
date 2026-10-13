import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"

import { AppText } from "../../../components/text/AppText"
import type { HomeAiInsightAction } from "../../dashboard/types/homeAiInsight"
import { colors, fonts, radii } from "../../../theme"

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
        <AppText style={styles.title} variant="subtitle">{action.label}</AppText>
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
        <AppText style={styles.fallback} variant="body">
          Ver detalle relacionado con esta acción.
        </AppText>
      )}
    </View>
  )
}

function DetailContent({ detail }: { detail: InsightActionDetail }) {
  if (detail.type === "fixed_expense_period") {
    return (
      <View>
        <AppText style={styles.detail} variant="subtitle">{detail.name}</AppText>
        <AppText variant="caption">Estado: {detail.status}</AppText>
        {detail.amount ? <AppText variant="caption">Monto: {detail.amount}</AppText> : null}
        {detail.dueDate ? <AppText variant="caption">Vence: {detail.dueDate}</AppText> : null}
      </View>
    )
  }

  if (detail.type === "budget") {
    return (
      <View>
        <AppText style={styles.detail} variant="subtitle">{detail.categoryName}</AppText>
        <AppText variant="caption">Uso: {detail.percentage}%</AppText>
        {detail.budgetAmount ? <AppText variant="caption">Presupuesto: {detail.budgetAmount}</AppText> : null}
        {detail.spent ? <AppText variant="caption">Gasto actual: {detail.spent}</AppText> : null}
      </View>
    )
  }

  return (
    <View>
      <AppText style={styles.detail} variant="subtitle">{detail.categoryName}</AppText>
      {detail.amount ? <AppText variant="caption">Gasto: {detail.amount}</AppText> : null}
      {detail.period ? <AppText variant="caption">Periodo: {detail.period}</AppText> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.popover,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
    width: "100%",
    zIndex: 2,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
  },
  closeButton: {
    marginLeft: 12,
  },
  closeText: {
    color: colors.mutedForeground,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
  },
  detail: {
    marginTop: 8,
  },
  fallback: {
    marginTop: 8,
  },
})
