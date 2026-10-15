import { useState } from "react"
import { Alert, StyleSheet, View } from "react-native"

import { TextField } from "../../../components/inputs/TextField"
import { AppText } from "../../../components/text/AppText"
import { supabase } from "../../../services/supabase"
import { colors, layout, typography } from "../../../theme"
import { PrimaryAuthButton } from "../components/PrimaryAuthButton"
import { SHORT_PASSWORD_MESSAGE, authErrorMessage } from "../services/authErrors"

type UpdatePasswordScreenProps = {
  onDone: () => void
}

export function UpdatePasswordScreen({ onDone }: UpdatePasswordScreenProps) {
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function save() {
    if (password.length < 6) {
      Alert.alert("Error", SHORT_PASSWORD_MESSAGE)
      return
    }
    if (password !== repeatPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.")
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        Alert.alert("Error", authErrorMessage(error))
        return
      }
      onDone()
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>Elige una contraseña nueva</AppText>
      <TextField
        onChangeText={setPassword}
        placeholder="Contraseña nueva"
        secureTextEntry
        value={password}
      />
      <TextField
        onChangeText={setRepeatPassword}
        placeholder="Repetir contraseña"
        secureTextEntry
        value={repeatPassword}
      />
      <PrimaryAuthButton
        label="Guardar contraseña"
        loading={loading}
        loadingLabel="Guardando..."
        onPress={() => {
          void save()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    gap: layout.titleContentGap,
    justifyContent: "center",
    padding: layout.sheetPadding,
  },
  title: {
    ...typography.display,
    color: colors.foreground,
    marginBottom: layout.titleContentGap,
  },
})
