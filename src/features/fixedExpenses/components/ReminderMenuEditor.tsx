import { StyleSheet, View } from "react-native"

import { NativeMenu } from "../../../components/menus/NativeMenu"
import { layout } from "../../../theme"

type ReminderOption = {
  days: number
  label: string
}

type ReminderMenuEditorProps = {
  days: number[]
  options: readonly ReminderOption[]
  labelFor: (days: number) => string
  onChange: (days: number[]) => void
}

export function ReminderMenuEditor({
  days,
  options,
  labelFor,
  onChange,
}: ReminderMenuEditorProps) {
  const selected = [...days].sort((left, right) => left - right)
  const unused = options.filter((option) => !selected.includes(option.days))

  function replace(day: number, next: number) {
    onChange(selected.map((value) => (value === day ? next : value)))
  }

  return (
    <View style={styles.stack}>
      {selected.map((day) => {
        const choices = choicesFor(day, selected, options, labelFor)
        return (
          <NativeMenu
            key={day}
            accessibilityLabel={labelFor(day)}
            entries={[
              ...choices.map((option) => ({
                id: String(option.days),
                selected: option.days === day,
                title: option.label,
              })),
              {
                id: "remove",
                destructive: true,
                separatorBefore: true,
                title: "Quitar",
              },
            ]}
            label={labelFor(day)}
            onSelect={(id) => {
              if (id === "remove") {
                onChange(selected.filter((value) => value !== day))
                return
              }
              replace(day, Number(id))
            }}
            variant="field"
          />
        )
      })}
      {unused.length > 0 ? (
        <NativeMenu
          accessibilityLabel="Agregar recordatorio"
          entries={unused.map((option) => ({
            id: String(option.days),
            title: option.label,
          }))}
          label="Agregar recordatorio"
          onSelect={(id) => onChange([...selected, Number(id)])}
          variant="field"
        />
      ) : null}
    </View>
  )
}

function choicesFor(
  day: number,
  selected: number[],
  options: readonly ReminderOption[],
  labelFor: (days: number) => string,
) {
  const taken = new Set(selected.filter((value) => value !== day))
  const current = options.some((option) => option.days === day)
    ? []
    : [{ days: day, label: labelFor(day) }]
  return [...options, ...current].filter(
    (option) => option.days === day || !taken.has(option.days),
  )
}

const styles = StyleSheet.create({
  stack: {
    gap: layout.titleContentGap,
  },
})
