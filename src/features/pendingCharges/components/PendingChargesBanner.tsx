import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fonts, radii } from "../../../theme"

import { AppText } from "../../../components/text/AppText"

import { ListSection } from "../../../components/layout/ListSection"

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
    ? "Tienes un gasto de tarjeta para cargar"
    : `Tienes ${count} gastos de tarjeta para cargar`

  return (
    <ListSection>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. Elige el espacio y la categoría.`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
      <View style={styles.copy}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText tone="muted" variant="caption">Elige el espacio y la categoría</AppText>
      </View>
    </Pressable>
    </ListSection>
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
})
