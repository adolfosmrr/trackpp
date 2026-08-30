import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useEffect, useState, type ReactNode } from "react"

import { FilterChevronIcon } from "../../../components/icons/FilterChevronIcon"
import type {
  TransactionCategory,
  TransactionCreator,
  TransactionDateFilter,
  TransactionFilters,
  TransactionOrder,
  TransactionTypeFilter,
} from "../types"

type TransactionFiltersModalProps = {
  visible: boolean
  filters: TransactionFilters
  householdType: "personal" | "couple"
  categories: TransactionCategory[]
  creators: TransactionCreator[]
  onChange: (filters: TransactionFilters) => void
  onClear: () => void
  onApply: () => void
  onCancel: () => void
}

export function TransactionFiltersModal({
  visible,
  filters,
  householdType,
  categories,
  creators,
  onChange,
  onClear,
  onApply,
  onCancel,
}: TransactionFiltersModalProps) {
  const [hasScrolled, setHasScrolled] = useState(false)
  useEffect(() => {
    if (visible) {
      setHasScrolled(false)
    }
  }, [visible])

  const rangeDate = filters.date.type === "range"
    ? filters.date
    : { type: "range" as const, from: "", to: "" }

  function setType(type: TransactionTypeFilter) {
    onChange({ ...filters, type })
  }

  function setOrder(order: TransactionOrder) {
    onChange({ ...filters, order })
  }

  function setDate(date: TransactionDateFilter) {
    onChange({ ...filters, date })
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={[styles.sheetHeader, hasScrolled && styles.sheetHeaderShadow]}>
            <Text style={styles.title}>Filtrar movimientos</Text>
            <Pressable onPress={onCancel} accessibilityLabel="Cerrar filtros">
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            onScroll={(event) => {
              const next = event.nativeEvent.contentOffset.y > 2
              setHasScrolled((current) => current === next ? current : next)
            }}
            scrollEventThrottle={16}
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
                  <Option key="all" label="Todas" grid selected={filters.categoryId === null} onPress={() => onChange({ ...filters, categoryId: null })} />,
                  ...categories.map((category) => (
                    <Option
                      key={category.id}
                      grid
                      label={`${category.icon ? `${category.icon} ` : ""}${category.name}`}
                      selected={filters.categoryId === category.id}
                      onPress={() => onChange({ ...filters, categoryId: category.id })}
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
                    <Option key="all" label="Todos" grid selected={filters.creatorId === null} onPress={() => onChange({ ...filters, creatorId: null })} />,
                    ...creators.map((creator) => (
                      <Option
                        key={creator.id}
                        grid
                        label={creator.name ?? "Sin nombre"}
                        selected={filters.creatorId === creator.id}
                        onPress={() => onChange({ ...filters, creatorId: creator.id })}
                      />
                    )),
                  ]).map((options, index) => (
                    <OptionRow key={index}>{options}</OptionRow>
                  ))}
                </OptionGrid>
              </FilterGroup>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearText}>Limpiar</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={onApply}>
              <Text style={styles.applyText}>Aplicar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
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

function Option({ label, selected, onPress, grid = false }: { label: string; selected: boolean; onPress: () => void; grid?: boolean }) {
  return (
    <Pressable style={[styles.option, grid && styles.gridOption, selected && styles.selectedOption]} onPress={onPress}>
      <Text style={[styles.optionText, selected && styles.selectedOptionText]}>{label}</Text>
      <FilterChevronIcon color={selected ? "#FFFFFF" : "#1C1C1C"} />
    </Pressable>
  )
}

function DateInput({ value, placeholder, onChangeText }: { value: string; placeholder: string; onChangeText: (value: string) => void }) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      autoCapitalize="none"
      keyboardType="numbers-and-punctuation"
      style={styles.dateInput}
    />
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#F5F5F5",
    maxHeight: "88%",
  },
  sheetHeader: {
    alignItems: "center",
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  sheetHeaderShadow: {
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 24,
    lineHeight: 24,
  },
  close: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 30,
  },
  content: {
    gap: 30,
    padding: 20,
    paddingBottom: 12,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 30,
    lineHeight: 30,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
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
    backgroundColor: "#000000",
  },
  optionText: {
    color: "#1C1C1C",
    flexShrink: 1,
    fontFamily: "FamiljenGrotesk-Black",
    fontSize: 16,
    lineHeight: 16,
  },
  selectedOptionText: {
    color: "#FFFFFF",
  },
  dateInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D0D0D0",
    borderRadius: 10,
    borderWidth: 1,
    color: "#1C1C1C",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  rangeInputs: {
    gap: 8,
  },
  actions: {
    backgroundColor: "#000000",
    borderTopColor: "#DDDDDD",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 20,
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 13,
  },
  clearText: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
  },
  applyButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 13,
  },
  applyText: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
  },
})
