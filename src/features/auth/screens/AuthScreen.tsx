import { useEffect, useRef, useState } from "react"
import { Alert, AppState, Pressable, StyleSheet, View } from "react-native"
import { useIsFocused } from "@react-navigation/native"
import { colors, layout, typography } from "../../../theme"
import { AppText } from "../../../components/text/AppText"

import AnimatedText from "../../../components/text/AnimatedText"
import { GradientBackground } from "../../../components/visual/GradientBackground"
import { AuthToggle, type AuthMode } from "../components/AuthToggle"
import { GoogleAuthButton } from "../components/GoogleAuthButton"
import { LoginForm, type LoginFormHandle } from "../components/LoginForm"
import {
  RegisterForm,
  type RegisterFormHandle,
} from "../components/RegisterForm"
import { PrimaryAuthButton } from "../components/PrimaryAuthButton"
import { signInWithGoogle } from "../services/googleAuth"

function useAppIsActive() {
  const [active, setActive] = useState(AppState.currentState === "active")

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      setActive(next === "active")
    })
    return () => subscription.remove()
  }, [])

  return active
}

export function AuthScreen() {
  const isFocused = useIsFocused()
  const appIsActive = useAppIsActive()
  const [mode, setMode] = useState<AuthMode>("login")
  const [authLoading, setAuthLoading] = useState(false)
  const formRef = useRef<LoginFormHandle | RegisterFormHandle>(null)
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
      <GradientBackground
        dotMotion={isFocused && appIsActive}
        dotSpacing={15}
        token="topSection"
      />

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
        <View style={styles.formArea}>
          {mode === "login" ? (
            <LoginForm ref={formRef} onLoadingChange={setAuthLoading} />
          ) : (
            <RegisterForm ref={formRef} onLoadingChange={setAuthLoading} />
          )}
          <PrimaryAuthButton
            label={mode === "login" ? "Ingresar" : "Crear cuenta"}
            loading={authLoading}
            loadingLabel={mode === "login" ? "Ingresando..." : "Creando..."}
            onPress={() => formRef.current?.submit()}
          />
        </View>
        <View style={styles.googleSection}>
          <View style={styles.separator}>
            <View style={styles.line} />
            <AppText tone="muted" variant="caption">O puedes</AppText>
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
            <AppText style={styles.link} variant="body">
              {mode === "login"
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: layout.sheetPadding,
    gap: 16,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authMessage: {
    ...typography.display,
    color: "#FFFFFF",
  },
  authMessageClip: {
    width: "100%",
    minHeight: typography.display.lineHeight,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  googleSection: {
    width: "100%",
  },
  formArea: {
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
    backgroundColor: colors.border,
  },
  link: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: layout.titleContentGap,
  },
})
