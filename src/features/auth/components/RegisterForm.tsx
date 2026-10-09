import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import {
  Alert,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import { colors, fonts, radii } from "../../../theme"

import { supabase } from "../../../services/supabase"

export type RegisterFormHandle = {
  submit: () => void
}

type RegisterFormProps = {
  onLoadingChange: (loading: boolean) => void
}

export const RegisterForm = forwardRef<RegisterFormHandle, RegisterFormProps>(
  function RegisterForm({ onLoadingChange }, ref) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useImperativeHandle(ref, () => ({ submit: handleRegister }), [email, password])

  useEffect(() => {
    onLoadingChange(loading)
  }, [loading, onLoadingChange])

  async function handleRegister() {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (error) {
        Alert.alert("Error", error.message)
        return
      }

      if (!data.session) {
        Alert.alert(
          "Revisa tu correo",
          "Te enviamos un correo para confirmar tu cuenta."
        )
      }
    } finally {
      setLoading(false)
    }
  }

    return (
      <View style={styles.container}>
      <View style={styles.inputsContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tú correo va acá"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Y tú contraseña acá"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

    </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
  },
  inputsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    backgroundColor: colors.field,
    color: colors.foreground,
    fontFamily: fonts.sans,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
})
