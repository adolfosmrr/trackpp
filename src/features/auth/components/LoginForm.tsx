import { useState } from "react"
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { supabase } from "../../../services/supabase"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

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
      <Pressable
        style={[styles.button, loading && styles.disabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Ingresando..." : "Ingresar"}
        </Text>
      </Pressable>

    </View>
  )
}

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
  button: {
    padding: 14,
    borderRadius: 50,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#000000", fontWeight: "600", fontSize: 16, fontFamily: "FamiljenGrotesk-Medium" },
})
