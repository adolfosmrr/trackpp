import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import {
  Alert,
  StyleSheet,
  TextInput,
  View,
} from "react-native"

import { supabase } from "../../../services/supabase"

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
        Alert.alert("Error", error.message)
        return
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
          placeholderTextColor="#8D8D8D"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Y tú contraseña acá"
          placeholderTextColor="#8D8D8D"
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
    width: '100%',
    justifyContent: "center",
  },
  inputsContainer: {
    gap: 10,
    marginBottom: 20
  },
  input: {
    borderWidth: 0,
    borderRadius: 9999,
    backgroundColor: "#1C1C1C",
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 20
  },
})
