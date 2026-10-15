import { useEffect, useRef, useState } from "react"
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
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { AnimatedText } from "../../../components/text/AnimatedText"
import { MatrixTextMorph } from "../../../components/text/MatrixTextMorph"
import { GradientBackground } from "../../../components/visual/GradientBackground"
import type { AuthStackParamList } from "../../../navigation/types"
import { colors, layout, typography } from "../../../theme"
import { authTabMotion } from "../authTabMotion"
import { AuthToggle, type AuthMode } from "../components/AuthToggle"
import { GoogleAuthButton } from "../components/GoogleAuthButton"
import { LoginForm, type LoginFormHandle } from "../components/LoginForm"
import { PrimaryAuthButton } from "../components/PrimaryAuthButton"
import { useAppIsActive } from "../hooks/useAppIsActive"
import { authErrorMessage } from "../services/authErrors"
import { signInWithGoogle } from "../services/googleAuth"

const LOGIN_GREETING = "¡Hola!\n¡Bienvenido de vuelta!"
const REGISTER_GREETING = "¡Hola persona que aún no conozco!"
const GREETING_OFFSCREEN = {
  opacity: 0,
  translateY: 16,
  scale: 0.8,
  rotate: 5,
} as const

type AuthProviderSectionProps = {
  divider: string
  footer: string
  googleLabel: string
  googleLoading: boolean
  onFooter: () => void
  onGoogle: () => void
}

function AuthProviderSection({
  divider,
  footer,
  googleLabel,
  googleLoading,
  onFooter,
  onGoogle,
}: AuthProviderSectionProps) {
  return (
    <View style={styles.googleSection}>
      <View style={styles.separator}>
        <View style={styles.line} />
        <MatrixTextMorph
          stepDuration={authTabMotion.labelStep}
          style={[typography.caption, styles.divider]}
          text={divider}
        />
        <View style={styles.line} />
      </View>
      <GoogleAuthButton
        label={googleLabel}
        loading={googleLoading}
        onPress={onGoogle}
      />
      <Pressable onPress={onFooter} style={styles.footerPress}>
        <MatrixTextMorph
          stepDuration={authTabMotion.labelStep}
          style={styles.link}
          text={footer}
        />
      </Pressable>
    </View>
  )
}

type AuthScreenProps = NativeStackScreenProps<AuthStackParamList, "Auth">

export function AuthScreen({ navigation }: AuthScreenProps) {
  const isFocused = useIsFocused()
  const appIsActive = useAppIsActive()
  const reducedMotion = useReducedMotion() === true
  const [mode, setMode] = useState<AuthMode>("login")
  const [authLoading, setAuthLoading] = useState(false)
  const formRef = useRef<LoginFormHandle>(null)
  const skipClip = useRef(true)
  const clipHeight = useSharedValue(
    typography.display.lineHeight * LOGIN_GREETING.split("\n").length,
  )
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const lines = (mode === "login" ? LOGIN_GREETING : REGISTER_GREETING).split("\n").length
    const next = typography.display.lineHeight * lines
    if (skipClip.current) {
      skipClip.current = false
      clipHeight.value = next
      return
    }
    if (reducedMotion) {
      clipHeight.value = next
      return
    }
    clipHeight.value = withTiming(next, {
      duration: authTabMotion.layout,
      easing: mode === "login" ? authTabMotion.enterEasing : authTabMotion.exitEasing,
    })
  }, [clipHeight, mode, reducedMotion])

  const clipStyle = useAnimatedStyle(() => ({
    minHeight: clipHeight.value,
  }))

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
          <Animated.View style={[styles.authMessageClip, clipStyle]}>
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
              enterFrom={GREETING_OFFSCREEN}
              exitFrom={{
                opacity: 1,
                translateY: 0,
                scale: 1,
                rotate: 0,
              }}
              exitTo={GREETING_OFFSCREEN}
              style={styles.authMessage}
            />
          </Animated.View>
          <AuthToggle value={mode} onChange={setMode} />
          <View style={styles.formArea}>
            <LoginForm
              onLoadingChange={setAuthLoading}
              ref={formRef}
              shown={mode === "login"}
            />
            <PrimaryAuthButton
              label={mode === "login" ? "Ingresar" : "Crear cuenta"}
              loading={mode === "login" && authLoading}
              loadingLabel="Ingresando..."
              onPress={() => {
                if (mode === "login") formRef.current?.submit()
                else navigation.navigate("SignUp")
              }}
            />
          </View>
          <AuthProviderSection
            divider={mode === "login" ? "O puedes" : "O puedes registrarte con"}
            footer={mode === "login"
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
            googleLabel={mode === "login"
              ? "Iniciar sesión con Google"
              : "Continuar con Google"}
            googleLoading={googleLoading}
            onFooter={() => setMode(mode === "login" ? "register" : "login")}
            onGoogle={() => {
              void handleGoogleLogin()
            }}
          />
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
  divider: {
    color: "#FFFFFF",
    fontFamily: typography.title.fontFamily,
  },
  footerPress: {
    alignItems: "center",
    width: "100%",
  },
  link: {
    color: "#FFFFFF",
    fontFamily: typography.title.fontFamily,
    textAlign: "center",
    marginTop: layout.titleContentGap,
  },
})
