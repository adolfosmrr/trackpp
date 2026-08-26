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
import { GoogleIcon } from "../../../components/icons/GoogleIcon"
import { signInWithGoogle } from "../services/googleAuth"

type RegisterFormProps = {
  onRequestLogin: () => void
}

export function RegisterForm({ onRequestLogin }: RegisterFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

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

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true)
      await signInWithGoogle()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión con Google"

      Alert.alert("Error", message)
    } finally {
      setGoogleLoading(false)
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
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creando..." : "Crear cuenta"}
        </Text>
      </Pressable>

      <View style={styles.separator}>
        <View style={styles.line}></View>
        <Text style={styles.separatorText}>O puedes</Text>
        <View style={styles.line}></View>
      </View>

      <Pressable
        style={[styles.googleButton, googleLoading && styles.disabled]}
        onPress={handleGoogleLogin}
        disabled={googleLoading}
      >
        <Text style={styles.googleButtonText}>
          {googleLoading ? "Conectando..." : "Registrarse con Google"}
        </Text>
        <View style={styles.googleIconContainer}>
          <GoogleIcon />
        </View>
      </Pressable>

      <Pressable onPress={onRequestLogin}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </Pressable>
    </View>
  )
}

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
    borderWidth: 0,
    borderRadius: 9999,
    backgroundColor: "#1C1C1C",
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  button: {
    padding: 14,
    borderRadius: 50,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "FamiljenGrotesk-Medium",
  },
  separator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 0.5,
    backgroundColor: "#1c1c1c",
  },
  separatorText: {
    color: "#1c1c1c",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 16,
    lineHeight: 16,
  },
  googleButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 9999,
    borderWidth: 0,
    backgroundColor: "#EAEAEA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  googleButtonText: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 16,
  },
  googleIconContainer: {
    width: 22,
    height: 22,
    flexShrink: 0,
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    fontFamily: "FamiljenGrotesk-Medium",
  },
})
