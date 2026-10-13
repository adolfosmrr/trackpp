import { useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { requireOptionalNativeModule } from "expo"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect"

import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import { ChevronDownIcon } from "../../../components/icons/ChevronDownIcon"
import { selectionToken } from "../../../navigation/selectionToken"
import type { AppStackParamList } from "../../../navigation/types"
import { colors, fonts, layout, radii } from "../../../theme"
import {
  CURRENCY_REGIONS,
  currencyChoiceLabel,
  currencyMatchesQuery,
  type CurrencyOption,
  type CurrencyRegion,
} from "../data/currencies"

// SymbolView's iOS entry loads SymbolModule immediately. Skip that require
// until a dev build actually contains the native module.
const symbolModule = requireOptionalNativeModule("SymbolModule")
const SymbolView = symbolModule
  ? (require("expo-symbols") as typeof import("expo-symbols")).SymbolView
  : null

const liquidGlassEnabled = isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

type CurrencyPickerScreenProps = NativeStackScreenProps<AppStackParamList, "CurrencyPicker">

export function CurrencyPickerScreen({ navigation, route }: CurrencyPickerScreenProps) {
  const { selectedCode, selectedCountry } = route.params
  const [query, setQuery] = useState("")
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null)
  const needle = query.trim()
  const searching = needle.length > 0
  const matches = useMemo(() => {
    if (!searching) return []
    return CURRENCY_REGIONS.flatMap((region) =>
      region.options.filter((option) => currencyMatchesQuery(option, needle)),
    )
  }, [needle, searching])

  function selectCurrency(option: CurrencyOption) {
    navigation.popTo("CreateHousehold", {
      currencySelection: {
        token: selectionToken(),
        code: option.code,
        country: option.country,
        currencyName: option.currency,
      },
    }, { merge: true })
  }

  function toggleRegion(regionId: string) {
    setExpandedRegionId((current) => (current === regionId ? null : regionId))
  }

  function updateQuery(value: string) {
    setQuery(value)
    if (value.trim().length === 0) setExpandedRegionId(null)
  }

  function clearQuery() {
    setQuery("")
    setExpandedRegionId(null)
  }

  return (
    <SheetScaffold
      onClose={() => navigation.goBack()}
      pinned={(
        <CurrencySearchField onChangeText={updateQuery} onClear={clearQuery} value={query} />
      )}
      title="Moneda"
    >
      {searching ? (
        matches.length > 0 ? (
          <CurrencyOptionList
            onSelect={selectCurrency}
            options={matches}
            selectedCode={selectedCode}
            selectedCountry={selectedCountry}
          />
        ) : (
          <AppText tone="muted" variant="body">No hay monedas que coincidan.</AppText>
        )
      ) : (
        CURRENCY_REGIONS.map((region) => (
          <CurrencyRegionCard
            key={region.id}
            onSelect={selectCurrency}
            onToggle={() => toggleRegion(region.id)}
            open={expandedRegionId === region.id}
            region={region}
            selectedCode={selectedCode}
            selectedCountry={selectedCountry}
          />
        ))
      )}
    </SheetScaffold>
  )
}

function CurrencySearchField({
  value,
  onChangeText,
  onClear,
}: {
  value: string
  onChangeText: (value: string) => void
  onClear: () => void
}) {
  const field = (
    <>
      <SearchSymbol
        fallback="⌕"
        name={{ android: "search", ios: "magnifyingglass", web: "search" }}
      />
      <TextInput
        accessibilityLabel="Buscar moneda"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder="Buscar"
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="search"
        style={styles.searchInput}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Borrar búsqueda"
          hitSlop={8}
          onPress={onClear}
          style={styles.clearButton}
        >
          <SearchSymbol
            fallback="×"
            name={{ android: "cancel", ios: "xmark.circle.fill", web: "cancel" }}
          />
        </Pressable>
      ) : null}
    </>
  )

  if (!liquidGlassEnabled) {
    return <View style={[styles.searchGlass, styles.fallback]}>{field}</View>
  }

  return (
    <GlassView colorScheme="dark" glassEffectStyle="clear" style={styles.searchGlass}>
      {field}
    </GlassView>
  )
}

function SearchSymbol({
  name,
  fallback,
}: {
  name: {
    ios: "magnifyingglass" | "xmark.circle.fill"
    android: "search" | "cancel"
    web: "search" | "cancel"
  }
  fallback: string
}) {
  if (!SymbolView) {
    return <Text style={styles.searchGlyph}>{fallback}</Text>
  }

  return (
    <SymbolView
      name={name}
      size={16}
      tintColor={colors.mutedForeground}
      weight="regular"
    />
  )
}

function CurrencyRegionCard({
  region,
  open,
  selectedCode,
  selectedCountry,
  onToggle,
  onSelect,
}: {
  region: CurrencyRegion
  open: boolean
  selectedCode: string
  selectedCountry: string
  onToggle: () => void
  onSelect: (option: CurrencyOption) => void
}) {
  const rotation = useSharedValue(0)
  const progress = useSharedValue(0)
  const measuredHeight = useSharedValue(0)
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))
  const listClipStyle = useAnimatedStyle(() => ({
    height: measuredHeight.value * progress.value,
  }))

  useEffect(() => {
    rotation.value = withTiming(open ? 180 : 0, { duration: 220 })
    progress.value = withTiming(open ? 1 : 0, { duration: 220 })
  }, [open, progress, rotation])

  function handleListLayout(event: LayoutChangeEvent) {
    measuredHeight.value = event.nativeEvent.layout.height
  }

  const header = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onToggle}
      style={styles.header}
    >
      <AppText variant="subtitle">{region.name}</AppText>
      <Animated.View style={chevronStyle}>
        <ChevronDownIcon />
      </Animated.View>
    </Pressable>
  )

  const list = (
    <CurrencyOptionList
      onSelect={onSelect}
      options={region.options}
      selectedCode={selectedCode}
      selectedCountry={selectedCountry}
    />
  )

  return (
    <View>
      {liquidGlassEnabled ? (
        <GlassView colorScheme="dark" glassEffectStyle="regular" style={styles.headerGlass}>
          {header}
        </GlassView>
      ) : (
        <View style={[styles.headerGlass, styles.fallback]}>{header}</View>
      )}
      <Animated.View style={[styles.listClip, listClipStyle]}>
        <View onLayout={handleListLayout} style={styles.listMeasure}>
          {list}
        </View>
      </Animated.View>
    </View>
  )
}

function CurrencyOptionList({
  options,
  selectedCode,
  selectedCountry,
  onSelect,
}: {
  options: readonly CurrencyOption[]
  selectedCode: string
  selectedCountry: string
  onSelect: (option: CurrencyOption) => void
}) {
  const rows = options.map((option) => {
    const selected = option.code === selectedCode && option.country === selectedCountry
    return (
      <Pressable
        key={option.country}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => onSelect(option)}
        style={[styles.option, selected && styles.optionSelected]}
      >
        <AppText tone={selected ? "brand" : "default"} variant="body">
          {currencyChoiceLabel(option)}
        </AppText>
      </Pressable>
    )
  })

  if (!liquidGlassEnabled) {
    return <View style={[styles.listGlass, styles.fallback]}>{rows}</View>
  }

  return (
    <GlassView colorScheme="dark" glassEffectStyle="regular" style={styles.listGlass}>
      {rows}
    </GlassView>
  )
}

const styles = StyleSheet.create({
  searchGlass: {
    alignItems: "center",
    borderRadius: radii.pill,
    flexDirection: "row",
    height: layout.headerPill,
    overflow: "hidden",
    paddingLeft: layout.titleContentGap,
  },
  searchInput: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    height: layout.headerPill,
    margin: 0,
    paddingHorizontal: layout.titleContentGap,
    paddingVertical: 0,
  },
  searchGlyph: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
    width: 16,
  },
  clearButton: {
    alignItems: "center",
    height: layout.headerPill,
    justifyContent: "center",
    width: layout.headerPill,
  },
  headerGlass: {
    borderRadius: radii.pill,
    height: layout.headerPill,
    justifyContent: "center",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: layout.titleContentGap,
  },
  listClip: {
    overflow: "hidden",
  },
  listMeasure: {
    left: 0,
    paddingTop: layout.titleContentGap,
    position: "absolute",
    right: 0,
  },
  listGlass: {
    borderRadius: radii.topSection,
    overflow: "hidden",
    paddingVertical: layout.titleContentGap,
  },
  option: {
    paddingHorizontal: layout.sheetPadding,
    paddingVertical: layout.titleContentGap,
  },
  optionSelected: {
    backgroundColor: colors.brandMuted,
  },
  fallback: {
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
})
