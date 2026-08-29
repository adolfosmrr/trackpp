import { StyleSheet, Text, View } from "react-native"

type MovementItemProps = {
  title: string
  categoryIcon?: string | null
  categoryName?: string | null
  amount: number
  type: "expense" | "income"
}

export function MovementItem({
  title,
  categoryIcon,
  categoryName,
  amount,
  type,
}: MovementItemProps) {
  return (
    <View style={styles.item}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.bottomRow}>
        <View style={styles.category}>
          {categoryIcon ? <Text style={styles.categoryIcon}>{categoryIcon}</Text> : null}
          <Text style={styles.categoryName}>
            {categoryName || "Sin categoría"}
          </Text>
        </View>

        <Text style={styles.amount}>
          {type === "expense" ? "-" : "+"}
          {formatCurrency(Math.abs(amount))}
        </Text>
      </View>
    </View>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(amount)
}

const styles = StyleSheet.create({
  item: {
    width: "100%",
    backgroundColor: "#000000",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    lineHeight: 24,
    fontFamily: "FamiljenGrotesk-Bold",
    color: "#FFFFFF",
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 0,
  },
  category: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryIcon: {
    flexShrink: 0,
    fontSize: 16,
    lineHeight: 16,
  },
  categoryName: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: "Satoshi-Regular",
    color: "#FFFFFF",
  },
  amount: {
    flexShrink: 0,
    marginLeft: 10,
    textAlign: "right",
    fontFamily: "FamiljenGrotesk-Bold",
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 24,
  },
})
