import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native"

import { TextField } from "../../../components/inputs/TextField"
import { AppText } from "../../../components/text/AppText"
import { AuthEmailField } from "./AuthEmailField"

import { supabase } from "../../../services/supabase"
import { AUTH_REDIRECT_URL } from "../services/authCallback"
import { authErrorMessage } from "../services/authErrors"

export type LoginFormHandle = {
  submit: () => void
}

type LoginFormProps = {
  onLoadingChange: (loading: boolean) => void
}

export const LoginForm = forwardRef<LoginFormHandle, LoginFormProps>(
  function LoginForm({ onLoadingChange }, ref) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useImperativeHandle(ref, () => ({ submit: handleLogin }), [email, password])

  useEffect(() => {
    onLoadingChange(loading)
  }, [loading, onLoadingChange])

  async function handleLogin() {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        Alert.alert("Error", authErrorMessage(error))
        return
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert("Error", "Escribí tu correo para recuperar la contraseña.")
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: AUTH_REDIRECT_URL,
      })
      if (error) {
        Alert.alert("Error", authErrorMessage(error))
        return
      }
      Alert.alert(
        "Revisá tu correo",
        "Si el correo está registrado, te enviamos un enlace para elegir una contraseña nueva. Abrilo en este dispositivo.",
      )
    } finally {
      setLoading(false)
    }
  }

    return (
      <View style={styles.container}>
      <View style={styles.inputsContainer}>
        <AuthEmailField
          onChangeText={setEmail}
          placeholder="Tu correo va acá"
          value={email}
        />

        <TextField
          placeholder="Y tu contraseña acá"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable accessibilityRole="button" onPress={() => { void handleForgotPassword() }}>
          <AppText style={styles.forgot} tone="muted" variant="caption">
            ¿Olvidaste tu contraseña?
          </AppText>
        </Pressable>
      </View>
    </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: "center",
  },
  inputsContainer: {
    gap: 10,
    marginBottom: 20
  },
  forgot: {
    textAlign: "right",
  },
})
