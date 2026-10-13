import { useMemo, useState, type ReactNode } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Button } from "../../../components/buttons/Button"
import { GlassButton } from "../../../components/buttons/GlassButton"
import { FilterChevronIcon } from "../../../components/icons/FilterChevronIcon"
import { TextField } from "../../../components/inputs/TextField"
import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useHouseholdStore } from "../../../store/householdStore"
import type { AppStackParamList } from "../../../navigation/types"
import { colors, layout, radii } from "../../../theme"
import { useTransactions } from "../hooks/useTransactions"
import {
  defaultTransactionFilters,
  type TransactionDateFilter,
  type TransactionFilters,
  type TransactionOrder,
  type TransactionTypeFilter,
} from "../types"
import { getTransactionCategories, getTransactionCreators } from "../utils/transactionFilters"

type TransactionFiltersScreenProps = NativeStackScreenProps<AppStackParamList, "TransactionFilters">

export function TransactionFiltersScreen({ navigation, route }: TransactionFiltersScreenProps) {
  const [filters, setFilters] = useState<TransactionFilters>(route.params.filters)
  const selectedHouseholdId = useHouseholdStore((state) => state.selectedHouseholdId)
  const { data: memberships } = useHouseholds()
  const { data: transactions } = useTransactions()
  const householdType = memberships?.find(
    (membership) => membership.household.id === selectedHouseholdId,
  )?.household.type === "couple"
    ? "couple"
    : "personal"
  const categories = useMemo(
    () => getTransactionCategories(transactions ?? []),
    [transactions],
  )
  const creators = useMemo(
    () => getTransactionCreators(transactions ?? []),
    [transactions],
  )
  const rangeDate = filters.date.type === "range"
    ? filters.date
    : { type: "range" as const, from: "", to: "" }

  function setType(type: TransactionTypeFilter) {
    setFilters((current) => ({ ...current, type }))
  }

  function setOrder(order: TransactionOrder) {
    setFilters((current) => ({ ...current, order }))
  }

  function setDate(date: TransactionDateFilter) {
    setFilters((current) => ({ ...current, date }))
  }

  function apply() {
    navigation.navigate("Main", {
      screen: "Transactions",
      params: {
        appliedFilters: {
          ...filters,
          creatorId: householdType === "couple" ? filters.creatorId : null,
        },
      },
    })
  }

  return (
    <SheetScaffold
      closeAccessibilityLabel="Cerrar filtros"
      footer={(
        <View style={styles.footerRow}>
          <GlassButton
            accessibilityLabel="Limpiar filtros"
            fallbackStyle={styles.clearFallback}
            glassStyle={styles.actionSlot}
            label="Limpiar"
            onPress={() => setFilters(defaultTransactionFilters)}
            style={styles.actionSlot}
          />
          <Button label="Aplicar" onPress={apply} style={styles.actionSlot} tone="brand" />
        </View>
      )}
      onClose={() => navigation.goBack()}
      title="Filtrar movimientos"
    >
        <FilterGroup title="Tipo">
          <OptionRow>
            <Option label="Todos" grid selected={filters.type === "all"} onPress={() => setType("all")} />
            <Option label="Ingresos" grid selected={filters.type === "income"} onPress={() => setType("income")} />
          </OptionRow>
          <OptionRow>
            <Option label="Egresos" grid selected={filters.type === "expense"} onPress={() => setType("expense")} />
            <Option label="Gastos Fijos" grid selected={filters.type === "fixed"} onPress={() => setType("fixed")} />
          </OptionRow>
        </FilterGroup>

        <FilterGroup title="Ordenar">
          <Option label="Más nuevo al más viejo" selected={filters.order === "newest"} onPress={() => setOrder("newest")} />
          <Option label="Más viejo al más nuevo" selected={filters.order === "oldest"} onPress={() => setOrder("oldest")} />
          <Option label="Mayor a menor monto" selected={filters.order === "amount-desc"} onPress={() => setOrder("amount-desc")} />
          <Option label="Menor a mayor monto" selected={filters.order === "amount-asc"} onPress={() => setOrder("amount-asc")} />
        </FilterGroup>

        <FilterGroup title="Fecha">
          <OptionRow>
            <Option label="Cualquier fecha" grid selected={filters.date.type === "any"} onPress={() => setDate({ type: "any" })} />
            <Option label="Hoy" grid selected={filters.date.type === "today"} onPress={() => setDate({ type: "today" })} />
          </OptionRow>
          <OptionRow>
            <Option label="Este mes" grid selected={filters.date.type === "this-month"} onPress={() => setDate({ type: "this-month" })} />
            <Option label="Mes anterior" grid selected={filters.date.type === "previous-month"} onPress={() => setDate({ type: "previous-month" })} />
          </OptionRow>
          <Option
            label="Fecha específica"
            selected={filters.date.type === "specific"}
            onPress={() => setDate({
              type: "specific",
              date: filters.date.type === "specific" ? filters.date.date : "",
            })}
          />
          {filters.date.type === "specific" ? (
            <DateInput
              value={filters.date.date}
              placeholder="YYYY-MM-DD"
              onChangeText={(date) => setDate({ type: "specific", date })}
            />
          ) : null}
          <Option
            label="Rango de fechas"
            selected={filters.date.type === "range"}
            onPress={() => setDate({
              type: "range",
              from: filters.date.type === "range" ? filters.date.from : "",
              to: filters.date.type === "range" ? filters.date.to : "",
            })}
          />
          {filters.date.type === "range" ? (
            <View style={styles.rangeInputs}>
              <DateInput
                value={rangeDate.from}
                placeholder="Desde YYYY-MM-DD"
                onChangeText={(from) => setDate({ type: "range", from, to: rangeDate.to })}
              />
              <DateInput
                value={rangeDate.to}
                placeholder="Hasta YYYY-MM-DD"
                onChangeText={(to) => setDate({ type: "range", from: rangeDate.from, to })}
              />
            </View>
          ) : null}
        </FilterGroup>

        <FilterGroup title="Categoría">
          <OptionGrid>
            {chunkOptions([
              <Option key="all" label="Todas" grid selected={filters.categoryId === null} onPress={() => setFilters((current) => ({ ...current, categoryId: null }))} />,
              ...categories.map((category) => (
                <Option
                  key={category.id}
                  grid
                  label={`${category.icon ? `${category.icon} ` : ""}${category.name}`}
                  selected={filters.categoryId === category.id}
                  onPress={() => setFilters((current) => ({ ...current, categoryId: category.id }))}
                />
              )),
            ]).map((options, index) => (
              <OptionRow key={index}>{options}</OptionRow>
            ))}
          </OptionGrid>
        </FilterGroup>

        {householdType === "couple" ? (
          <FilterGroup title="Persona">
            <OptionGrid>
              {chunkOptions([
                <Option key="all" label="Todos" grid selected={filters.creatorId === null} onPress={() => setFilters((current) => ({ ...current, creatorId: null }))} />,
                ...creators.map((creator) => (
                  <Option
                    key={creator.id}
                    grid
                    label={creator.name ?? "Sin nombre"}
                    selected={filters.creatorId === creator.id}
                    onPress={() => setFilters((current) => ({ ...current, creatorId: creator.id }))}
                  />
                )),
              ]).map((options, index) => (
                <OptionRow key={index}>{options}</OptionRow>
              ))}
            </OptionGrid>
          </FilterGroup>
        ) : null}
    </SheetScaffold>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="sectionTitle">{title}</AppText>
      <View style={styles.options}>{children}</View>
    </View>
  )
}

function OptionRow({ children }: { children: ReactNode }) {
  return <View style={styles.optionRow}>{children}</View>
}

function OptionGrid({ children }: { children: ReactNode }) {
  return <View style={styles.options}>{children}</View>
}

function chunkOptions(options: ReactNode[]) {
  const rows: ReactNode[][] = []
  for (let index = 0; index < options.length; index += 2) {
    rows.push(options.slice(index, index + 2))
  }
  return rows
}

function Option({
  label,
  selected,
  onPress,
  grid = false,
}: {
  label: string
  selected: boolean
  onPress: () => void
  grid?: boolean
}) {
  return (
    <Pressable
      style={[styles.option, grid && styles.gridOption, selected && styles.selectedOption]}
      onPress={onPress}
    >
      <AppText tone={selected ? "onBrand" : "default"} variant="subtitle">{label}</AppText>
      <FilterChevronIcon color={selected ? colors.brandForeground : colors.foreground} />
    </Pressable>
  )
}

function DateInput({
  value,
  placeholder,
  onChangeText,
}: {
  value: string
  placeholder: string
  onChangeText: (value: string) => void
}) {
  return (
    <TextField
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      autoCapitalize="none"
      keyboardType="numbers-and-punctuation"
    />
  )
}

const styles = StyleSheet.create({
  group: {
    gap: layout.titleContentGap,
  },
  options: {
    gap: 10,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  gridOption: {
    flex: 1,
    minWidth: 0,
  },
  selectedOption: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  rangeInputs: {
    gap: 8,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionSlot: {
    flex: 1,
  },
  clearFallback: {
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    flex: 1,
  },
})
