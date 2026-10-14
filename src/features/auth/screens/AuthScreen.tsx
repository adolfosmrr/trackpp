import { useRef, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import { useIsFocused } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { AppText } from "../../../components/text/AppText"
import AnimatedText from "../../../components/text/AnimatedText"
import { GradientBackground } from "../../../components/visual/GradientBackground"
import type { AuthStackParamList } from "../../../navigation/types"
import { colors, layout, typography } from "../../../theme"
import { AuthToggle, type AuthMode } from "../components/AuthToggle"
import { GoogleAuthButton } from "../components/GoogleAuthButton"
import { LoginForm, type LoginFormHandle } from "../components/LoginForm"
import { PrimaryAuthButton } from "../components/PrimaryAuthButton"
import { useAppIsActive } from "../hooks/useAppIsActive"
import { authErrorMessage } from "../services/authErrors"
import { signInWithGoogle } from "../services/googleAuth"

const LOGIN_GREETING = "¡Hola!\n¡Bienvenido de vuelta!"
const REGISTER_GREETING = "¡Hola persona que aún no conozco!"

type AuthScreenProps = NativeStackScreenProps<AuthStackParamList, "Auth">

export function AuthScreen({ navigation }: AuthScreenProps) {
  const isFocused = useIsFocused()
  const appIsActive = useAppIsActive()
  const [mode, setMode] = useState<AuthMode>("login")
  const [authLoading, setAuthLoading] = useState(false)
  const formRef = useRef<LoginFormHandle>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true)
      await signInWithGoogle()
    } catch (error) {
      Alert.alert("Error", authErrorMessage(error))
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.avoider}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          style={styles.avoider}
        >
          <View
            style={[
              styles.authMessageClip,
              {
                minHeight:
                  typography.display.lineHeight *
                  (mode === "login" ? LOGIN_GREETING : REGISTER_GREETING).split("\n").length,
              },
            ]}
          >
            <AnimatedText
              text={mode === "login" ? LOGIN_GREETING : REGISTER_GREETING}
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
          <AuthToggle value={mode} onChange={setMode} />
          {mode === "login" ? (
            <>
              <View style={styles.formArea}>
                <LoginForm ref={formRef} onLoadingChange={setAuthLoading} />
                <PrimaryAuthButton
                  label="Ingresar"
                  loading={authLoading}
                  loadingLabel="Ingresando..."
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
                  label="Iniciar sesión con Google"
                  loading={googleLoading}
                  onPress={handleGoogleLogin}
                />
                <Pressable onPress={() => setMode("register")}>
                  <AppText style={styles.link} variant="body">
                    ¿No tienes cuenta? Regístrate
                  </AppText>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.registerActions}>
              <PrimaryAuthButton
                label="Crear cuenta"
                onPress={() => navigation.navigate("SignUp")}
              />
              <GoogleAuthButton
                label="Continuar con Google"
                loading={googleLoading}
                onPress={handleGoogleLogin}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  avoider: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: layout.sheetPadding,
    gap: 16,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  authMessage: {
    ...typography.display,
    color: "#FFFFFF",
  },
  authMessageClip: {
    width: "100%",
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
  registerActions: {
    gap: 16,
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
    fontFamily: typography.title.fontFamily,
    textAlign: "center",
    marginTop: layout.titleContentGap,
  },
})
