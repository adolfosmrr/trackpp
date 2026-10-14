import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react"
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated"

import { TextField } from "../../../components/inputs/TextField"
import { AppText } from "../../../components/text/AppText"
import { typography } from "../../../theme"
import { supabase } from "../../../services/supabase"
import { authTabMotion } from "../authTabMotion"
import { AUTH_REDIRECT_URL } from "../services/authCallback"
import { authErrorMessage } from "../services/authErrors"
import { AuthEmailField } from "./AuthEmailField"

const motionEasing = Easing.out(Easing.cubic)

export type LoginFormHandle = {
  submit: () => void
}

type LoginFormProps = {
  onLoadingChange: (loading: boolean) => void
  shown: boolean
}

export const LoginForm = forwardRef<LoginFormHandle, LoginFormProps>(
  function LoginForm({ onLoadingChange, shown }, ref) {
    const reducedMotion = useReducedMotion() === true
    const skipFirst = useRef(true)
    const measured = useSharedValue(0)
    const slot = useSharedValue(1)
    const fieldEmail = useSharedValue(1)
    const fieldPassword = useSharedValue(1)
    const fieldForgot = useSharedValue(1)
    const [contentHeight, setContentHeight] = useState(0)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    useImperativeHandle(ref, () => ({ submit: handleLogin }), [email, password])

    useEffect(() => {
      onLoadingChange(loading)
    }, [loading, onLoadingChange])

    useEffect(() => {
      if (skipFirst.current) {
        skipFirst.current = false
        return
      }

      const fade = { duration: authTabMotion.fade, easing: motionEasing }
      const layout = { duration: authTabMotion.layout, easing: motionEasing }
      if (reducedMotion) {
        const value = shown ? 1 : 0
        slot.value = value
        fieldEmail.value = value
        fieldPassword.value = value
        fieldForgot.value = value
        return
      }

      if (!shown) {
        slot.value = withTiming(0, layout)
        fieldEmail.value = withTiming(0, fade)
        fieldPassword.value = withDelay(authTabMotion.stagger, withTiming(0, fade))
        fieldForgot.value = withDelay(authTabMotion.stagger * 2, withTiming(0, fade))
        return
      }

      const revealDelay = slot.value < 0.05 ? authTabMotion.layout : 0
      slot.value = withTiming(1, layout)
      fieldEmail.value = withDelay(revealDelay, withTiming(1, fade))
      fieldPassword.value = withDelay(revealDelay + authTabMotion.stagger, withTiming(1, fade))
      fieldForgot.value = withDelay(revealDelay + authTabMotion.stagger * 2, withTiming(1, fade))
    }, [fieldEmail, fieldForgot, fieldPassword, reducedMotion, shown, slot])

    function rememberHeight(event: LayoutChangeEvent) {
      const next = event.nativeEvent.layout.height
      if (next <= measured.value) return
      measured.value = next
      setContentHeight(next)
    }

    const slotStyle = useAnimatedStyle(() => {
      if (measured.value === 0) return { overflow: "hidden" }
      return {
        height: measured.value * slot.value,
        overflow: "hidden",
      }
    })

    async function handleLogin() {
      try {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          Alert.alert("Error", authErrorMessage(error))
        }
      } finally {
        setLoading(false)
      }
    }

    async function handleForgotPassword() {
      const cleanEmail = email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        Alert.alert("Error", "Escribe tu correo para recuperar la contraseña.")
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
          "Revisa tu correo",
          "Si el correo está registrado, te enviamos un enlace para elegir una contraseña nueva. Ábrelo en este dispositivo.",
        )
      } finally {
        setLoading(false)
      }
    }

    return (
      <Animated.View
        accessibilityElementsHidden={!shown}
        importantForAccessibility={shown ? "auto" : "no-hide-descendants"}
        pointerEvents={shown ? "auto" : "none"}
        style={slotStyle}
      >
        <View
          onLayout={rememberHeight}
          style={[styles.inputs, contentHeight > 0 ? { height: contentHeight } : null]}
        >
          <FieldMotion progress={fieldEmail}>
            <AuthEmailField
              onChangeText={setEmail}
              placeholder="Tu correo va acá"
              value={email}
            />
          </FieldMotion>
          <FieldMotion progress={fieldPassword}>
            <TextField
              onChangeText={setPassword}
              placeholder="Y tu contraseña acá"
              secureTextEntry
              value={password}
            />
          </FieldMotion>
          <FieldMotion progress={fieldForgot}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void handleForgotPassword()
              }}
            >
              <AppText style={styles.forgot} tone="muted" variant="caption">
                ¿Olvidaste tu contraseña?
              </AppText>
            </Pressable>
          </FieldMotion>
        </View>
      </Animated.View>
    )
  },
)

function FieldMotion({
  children,
  progress,
}: {
  children: ReactNode
  progress: SharedValue<number>
}) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (progress.value - 1) * authTabMotion.slide }],
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}

const styles = StyleSheet.create({
  inputs: {
    gap: 10,
    paddingBottom: 20,
    width: "100%",
  },
  forgot: {
    fontFamily: typography.title.fontFamily,
    textAlign: "center",
  },
})
