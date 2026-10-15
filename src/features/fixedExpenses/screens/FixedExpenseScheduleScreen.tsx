import { useState } from "react"
import { Platform, Pressable, StyleSheet, Switch, View } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Button } from "../../../components/buttons/Button"
import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import { ReminderMenuEditor } from "../components/ReminderMenuEditor"
import { selectionToken } from "../../../navigation/selectionToken"
import type { AppStackParamList } from "../../../navigation/types"
import { colors, layout, radii } from "../../../theme"
import { toLocalDateString } from "../../../utils/localDate"
import {
  START_REMINDER_PRESETS,
  chargeReminderLabel,
  normalizeStartReminderDays,
  parseDateInputValue,
} from "../utils/reminders"

type FixedExpenseScheduleScreenProps = NativeStackScreenProps<
  AppStackParamList,
  "FixedExpenseSchedule"
>

export function FixedExpenseScheduleScreen({
  navigation,
  route,
}: FixedExpenseScheduleScreenProps) {
  const [startsOn, setStartsOn] = useState(
    route.params.startsOn ?? toLocalDateString(new Date()),
  )
  const [endsOn, setEndsOn] = useState(route.params.endsOn)
  const [endEnabled, setEndEnabled] = useState(route.params.endsOn != null)
  const [startReminderDays, setStartReminderDays] = useState(
    route.params.startReminderDays,
  )
  const [showStartPicker, setShowStartPicker] = useState(Platform.OS === "ios")
  const [showEndPicker, setShowEndPicker] = useState(Platform.OS === "ios")

  function commit() {
    navigation.popTo("CreateMovement", {
      scheduleSelection: {
        token: selectionToken(),
        startsOn,
        endsOn: endEnabled ? endsOn ?? startsOn : null,
        startReminderDays: normalizeStartReminderDays(startReminderDays),
      },
    }, { merge: true })
  }

  return (
    <SheetScaffold onClose={() => navigation.goBack()} title="Programar">
      <View style={styles.block}>
        <AppText variant="sectionTitle">Fecha de inicio</AppText>
        {Platform.OS === "ios" ? null : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowStartPicker(true)}
            style={styles.dateButton}
          >
            <AppText variant="subtitle">{startsOn}</AppText>
          </Pressable>
        )}
        {showStartPicker ? (
          <DatePicker
            minimumDate={undefined}
            value={parseDateInputValue(startsOn)}
            onChange={(date) => {
              const next = toLocalDateString(date)
              setStartsOn(next)
              if (endsOn && endsOn < next) setEndsOn(next)
            }}
            onDismiss={() => setShowStartPicker(false)}
          />
        ) : null}
      </View>

      <View style={styles.block}>
        <View style={styles.endRow}>
          <AppText variant="sectionTitle">Fecha de finalización</AppText>
          <Switch
            accessibilityLabel="Fecha de finalización opcional"
            onValueChange={(enabled) => {
              setEndEnabled(enabled)
              if (enabled) setEndsOn((current) => current ?? startsOn)
              if (!enabled) setShowEndPicker(Platform.OS === "ios")
            }}
            thumbColor={colors.foreground}
            trackColor={{ false: colors.control, true: colors.brand }}
            value={endEnabled}
          />
        </View>
        <AppText tone="muted" variant="caption">Opcional.</AppText>
        {endEnabled ? (
          <>
            {Platform.OS === "ios" ? null : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowEndPicker(true)}
                style={styles.dateButton}
              >
                <AppText variant="subtitle">{endsOn ?? startsOn}</AppText>
              </Pressable>
            )}
            {showEndPicker ? (
              <DatePicker
                minimumDate={parseDateInputValue(startsOn)}
                value={parseDateInputValue(endsOn ?? startsOn)}
                onChange={(date) => setEndsOn(toLocalDateString(date))}
                onDismiss={() => setShowEndPicker(false)}
              />
            ) : null}
          </>
        ) : null}
      </View>

      <View style={styles.block}>
        <AppText variant="sectionTitle">Avisos antes de que empiece</AppText>
        <ReminderMenuEditor
          days={startReminderDays}
          labelFor={chargeReminderLabel}
          onChange={(days) => setStartReminderDays(normalizeStartReminderDays(days))}
          options={START_REMINDER_PRESETS}
        />
      </View>

      <Button label="Listo" onPress={commit} tone="brand" />
    </SheetScaffold>
  )
}

function DatePicker({
  value,
  minimumDate,
  onChange,
  onDismiss,
}: {
  value: Date
  minimumDate: Date | undefined
  onChange: (date: Date) => void
  onDismiss: () => void
}) {
  if (Platform.OS === "ios") {
    return (
      <DateTimePicker
        accentColor={colors.brand}
        display="inline"
        minimumDate={minimumDate}
        mode="date"
        onChange={(_event, date) => {
          if (date) onChange(date)
        }}
        themeVariant="dark"
        value={value}
      />
    )
  }

  return (
    <DateTimePicker
      display="default"
      minimumDate={minimumDate}
      mode="date"
      onChange={(_event, date) => {
        if (date) onChange(date)
        onDismiss()
      }}
      value={value}
    />
  )
}

const styles = StyleSheet.create({
  block: {
    gap: layout.titleContentGap,
  },
  endRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateButton: {
    backgroundColor: colors.field,
    borderRadius: radii.pill,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
})
