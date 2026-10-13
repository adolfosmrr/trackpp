import { useEffect, useState } from "react"
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
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
import { colors, layout, radii } from "../../../theme"
import {
  CURRENCY_REGIONS,
  currencyChoiceLabel,
  type CurrencyOption,
  type CurrencyRegion,
} from "../data/currencies"

const liquidGlassEnabled = isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

type CurrencyPickerScreenProps = NativeStackScreenProps<AppStackParamList, "CurrencyPicker">

export function CurrencyPickerScreen({ navigation, route }: CurrencyPickerScreenProps) {
  const { selectedCode, selectedCountry } = route.params
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null)

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

  return (
    <SheetScaffold onClose={() => navigation.goBack()} title="Moneda">
      {CURRENCY_REGIONS.map((region) => (
        <CurrencyRegionCard
          key={region.id}
          onSelect={selectCurrency}
          onToggle={() => toggleRegion(region.id)}
          open={expandedRegionId === region.id}
          region={region}
          selectedCode={selectedCode}
          selectedCountry={selectedCountry}
        />
      ))}
    </SheetScaffold>
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

  const options = region.options.map((option) => {
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

  const list = liquidGlassEnabled ? (
    <GlassView colorScheme="dark" glassEffectStyle="regular" style={styles.listGlass}>
      {options}
    </GlassView>
  ) : (
    <View style={[styles.listGlass, styles.fallback]}>{options}</View>
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

const styles = StyleSheet.create({
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
