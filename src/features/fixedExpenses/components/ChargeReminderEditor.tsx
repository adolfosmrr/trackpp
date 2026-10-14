import { useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { FieldChevronIcon } from "../../../components/icons/FieldChevronIcon"
import { fieldStyles } from "../../../components/inputs/TextField"
import { AppText } from "../../../components/text/AppText"
import { colors, layout, radii } from "../../../theme"
import {
  CHARGE_REMINDER_PRESETS,
  chargeReminderLabel,
  normalizeChargeReminderDays,
} from "../utils/reminders"

type ChargeReminderEditorProps = {
  days: number[]
  onChange: (days: number[]) => void
}

export function ChargeReminderEditor({ days, onChange }: ChargeReminderEditorProps) {
  const [choosing, setChoosing] = useState(false)
  const selected = normalizeChargeReminderDays(days)
  const unused = CHARGE_REMINDER_PRESETS.filter(
    (preset) => !selected.includes(preset.days),
  )

  return (
    <View style={styles.stack}>
      {selected.map((day) => (
        <View
          key={day}
          style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}
        >
          <AppText variant="subtitle">{chargeReminderLabel(day)}</AppText>
          <Pressable
            accessibilityLabel={`Quitar ${chargeReminderLabel(day)}`}
            hitSlop={8}
            onPress={() => onChange(selected.filter((value) => value !== day))}
          >
            <AppText tone="muted" variant="subtitle">Quitar</AppText>
          </Pressable>
        </View>
      ))}
      {unused.length === 0 ? null : choosing ? (
        <View style={styles.choices}>
          {unused.map((preset) => (
            <Pressable
              key={preset.days}
              accessibilityRole="button"
              onPress={() => {
                onChange(normalizeChargeReminderDays([...selected, preset.days]))
                setChoosing(false)
              }}
              style={styles.choice}
            >
              <AppText variant="subtitle">{preset.label}</AppText>
            </Pressable>
          ))}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setChoosing(true)}
          style={[fieldStyles.surface, fieldStyles.row, fieldStyles.pill]}
        >
          <AppText variant="subtitle">Agregar recordatorio</AppText>
          <FieldChevronIcon />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: {
    gap: layout.titleContentGap,
  },
  choices: {
    gap: 8,
  },
  choice: {
    backgroundColor: colors.control,
    borderRadius: radii.pill,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
})
