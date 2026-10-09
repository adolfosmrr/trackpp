import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fonts, radii } from "../../../theme"

import { usePendingCharges } from "../hooks/usePendingCharges"

type PendingChargesBannerProps = {
  onPress: () => void
}

export function PendingChargesBanner({ onPress }: PendingChargesBannerProps) {
  const { data: charges, isError } = usePendingCharges()
  const count = charges?.length ?? 0

  if (isError || count === 0) {
    return null
  }

  const title = count === 1
    ? "Tenés un gasto de tarjeta para cargar"
    : `Tenés ${count} gastos de tarjeta para cargar`

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. Elegí el espacio y la categoría.`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Elegí el espacio y la categoría</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.brandBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.brandMuted,
    borderRadius: radii.sm,
    height: 32,
    justifyContent: "center",
    minWidth: 32,
    paddingHorizontal: 8,
  },
  badgeText: {
    color: colors.brand,
    fontFamily: fonts.monoSemibold,
    fontSize: 16,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 18,
  },
})
