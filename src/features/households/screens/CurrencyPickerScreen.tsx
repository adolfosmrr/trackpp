import { useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import Animated, {
  FadeIn,
  LinearTransition,
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

  return (
    <SheetScaffold onClose={() => navigation.goBack()} title="Moneda">
      {CURRENCY_REGIONS.map((region) => (
        <CurrencyRegionCard
          key={region.id}
          onSelect={selectCurrency}
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
  selectedCode,
  selectedCountry,
  onSelect,
}: {
  region: CurrencyRegion
  selectedCode: string
  selectedCountry: string
  onSelect: (option: CurrencyOption) => void
}) {
  const containsSelection = region.options.some(
    (option) => option.code === selectedCode && option.country === selectedCountry,
  )
  const [open, setOpen] = useState(containsSelection)
  const rotation = useSharedValue(containsSelection ? 180 : 0)
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  function toggle() {
    const next = !open
    setOpen(next)
    rotation.value = withTiming(next ? 180 : 0, { duration: 180 })
  }

  const body = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={styles.header}
      >
        <AppText variant="subtitle">{region.name}</AppText>
        <Animated.View style={chevronStyle}>
          <ChevronDownIcon />
        </Animated.View>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(180)} layout={LinearTransition.duration(180)}>
          {region.options.map((option) => {
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
          })}
        </Animated.View>
      ) : null}
    </>
  )

  if (!liquidGlassEnabled) {
    return <View style={[styles.card, styles.cardFallback]}>{body}</View>
  }

  return (
    <GlassView colorScheme="dark" glassEffectStyle="regular" style={styles.card}>
      {body}
    </GlassView>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  cardFallback: {
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: layout.headerPill,
    paddingHorizontal: layout.titleContentGap,
  },
  option: {
    paddingHorizontal: layout.titleContentGap,
    paddingVertical: layout.titleContentGap,
  },
  optionSelected: {
    backgroundColor: colors.brandMuted,
  },
})
