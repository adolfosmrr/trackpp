import { useState } from "react"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"

import { GridBackground } from "../../../components/layout/GridBackground"
import AnimatedText from "../../../components/text/AnimatedText"
import { MeshGradient } from "../../../components/visual/MeshGradient"
import { AuthToggle, type AuthMode } from "../components/AuthToggle"
import { GoogleAuthButton } from "../components/GoogleAuthButton"
import { LoginForm } from "../components/LoginForm"
import { RegisterForm } from "../components/RegisterForm"
import { signInWithGoogle } from "../services/googleAuth"

const SHOW_MESH_GRADIENT = false

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [googleLoading, setGoogleLoading] = useState(false)

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode)
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
      {SHOW_MESH_GRADIENT ? (
        <MeshGradient
          colors={["#00ABBB", "#FD9785", "#FFF", "#FFF"]}
          speed={0.5}
          blur={0.5}
          noise={0.3}
          intensity={1}
          animated
          style={styles.meshBackground}
        />
      ) : null}
      <GridBackground />

      <View style={styles.content}>
        <View style={styles.authMessageClip}>
          <AnimatedText
            text={
              mode === "login"
                ? "¡Hola! ¡Bienvenido de vuelta!"
                : "¡Hola persona que aún no conozco!"
            }
            animationConfig={{
              spring: {
                damping: 18,
                stiffness: 280,
                mass: 1,
              },
              characterDelay: 15,
            }}
            enterFrom={{
              opacity: 0,
              translateY: 16,
              scale: 0.8,
              rotate: 5,
            }}
            exitFrom={{
              opacity: 1,
              translateY: 0,
              scale: 1,
              rotate: 0,
            }}
            style={styles.authMessage}
          />
        </View>
        <AuthToggle value={mode} onChange={handleModeChange} />
        {mode === "login" ? (
          <LoginForm />
        ) : (
          <RegisterForm />
        )}
        <View style={styles.googleSection}>
          <View style={styles.separator}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>O puedes</Text>
            <View style={styles.line} />
          </View>
          <GoogleAuthButton
            label={
              mode === "login"
                ? "Iniciar sesión con Google"
                : "Registrarse con Google"
            }
            loading={googleLoading}
            onPress={handleGoogleLogin}
          />
          <Pressable
            onPress={() => setMode(mode === "login" ? "register" : "login")}
          >
            <Text style={styles.link}>
              {mode === "login"
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meshBackground: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  authMessage: {
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 45,
    lineHeight: 42,
    color: "#8E8E8E",
  },
  authMessageClip: {
    width: "100%",
    minHeight: 40,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  googleSection: {
    width: "100%",
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
  link: {
    textAlign: "center",
    marginTop: 20,
    fontFamily: "FamiljenGrotesk-Medium",
  },
})
