import { Pressable, StyleSheet, View } from "react-native"

import { TextField } from "../../../components/inputs/TextField"
import { AppText } from "../../../components/text/AppText"
import { suggestedEmail } from "../services/emailSuggestion"

type AuthEmailFieldProps = {
  onChangeText: (value: string) => void
  placeholder: string
  value: string
}

export function AuthEmailField({ onChangeText, placeholder, value }: AuthEmailFieldProps) {
  const suggestion = suggestedEmail(value)

  return (
    <View style={styles.wrap}>
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        onChangeText={onChangeText}
        placeholder={placeholder}
        value={value}
      />
      {suggestion ? (
        <Pressable accessibilityRole="button" onPress={() => onChangeText(suggestion)}>
          <AppText tone="brand" variant="caption">
            {`¿Quisiste decir ${suggestion}?`}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    width: "100%",
  },
})
