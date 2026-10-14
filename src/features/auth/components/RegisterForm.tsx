import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import Animated, { FadeInDown, FadeOut, useReducedMotion } from "react-native-reanimated"

import { TextField } from "../../../components/inputs/TextField"
import { AppText } from "../../../components/text/AppText"
import { supabase } from "../../../services/supabase"
import { colors, radii } from "../../../theme"
import { AUTH_REDIRECT_URL } from "../services/authCallback"
import { authErrorMessage } from "../services/authErrors"

export type RegisterFormHandle = {
  submit: () => void
}

type RegisterFormProps = {
  onLoadingChange: (loading: boolean) => void
}

export const RegisterForm = forwardRef<RegisterFormHandle, RegisterFormProps>(
  function RegisterForm({ onLoadingChange }, ref) {
    const reducedMotion = useReducedMotion()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [repeatPassword, setRepeatPassword] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [birthDate, setBirthDate] = useState<Date | null>(null)
    const [pickerOpen, setPickerOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const revealDetails = password.length > 0

    useImperativeHandle(ref, () => ({ submit: handleRegister }), [
      birthDate,
      email,
      firstName,
      lastName,
      password,
      repeatPassword,
    ])

    useEffect(() => {
      onLoadingChange(loading)
    }, [loading, onLoadingChange])

    function openBirthDate() {
      const value = birthDate ?? new Date(2000, 0, 1)
      if (Platform.OS === "android") {
        DateTimePickerAndroid.open({
          maximumDate: new Date(),
          minimumDate: new Date(1900, 0, 1),
          mode: "date",
          onValueChange: (_event, date) => {
            if (date) setBirthDate(date)
          },
          value,
        })
        return
      }
      setPickerOpen((open) => !open)
    }

    async function handleRegister() {
      const problem = registerProblem({
        birthDate,
        email,
        firstName,
        lastName,
        password,
        repeatPassword,
      })
      if (problem) {
        Alert.alert("Error", problem)
        return
      }

      const cleanEmail = email.trim().toLowerCase()
      const cleanFirstName = firstName.trim()
      const cleanLastName = lastName.trim()
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: AUTH_REDIRECT_URL,
            data: {
              name: cleanFirstName,
              full_name: cleanFirstName,
              given_name: cleanFirstName,
              family_name: cleanLastName,
              birth_date: birthDate ? toIsoDate(birthDate) : null,
            },
          },
        })

        if (error) {
          Alert.alert("Error", authErrorMessage(error))
          return
        }

        if (!data.session) {
          Alert.alert(
            "Revisá tu correo",
            "Te enviamos un enlace para confirmar la cuenta. Abrilo en este dispositivo.",
          )
        }
      } finally {
        setLoading(false)
      }
    }

    return (
      <View style={styles.container}>
        <View style={styles.inputsContainer}>
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Tu correo va acá"
            value={email}
          />
          <TextField
            onChangeText={setPassword}
            placeholder="Y tu contraseña acá"
            secureTextEntry
            value={password}
          />
          {revealDetails ? (
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.duration(280)}
              exiting={reducedMotion ? undefined : FadeOut.duration(180)}
              style={styles.details}
            >
              <TextField
                onChangeText={setRepeatPassword}
                placeholder="Repetir contraseña"
                secureTextEntry
                value={repeatPassword}
              />
              <TextField
                autoCapitalize="words"
                onChangeText={setFirstName}
                placeholder="Nombre"
                value={firstName}
              />
              <TextField
                autoCapitalize="words"
                onChangeText={setLastName}
                placeholder="Apellido"
                value={lastName}
              />
              <Pressable accessibilityRole="button" onPress={openBirthDate} style={styles.dateRow}>
                <AppText tone={birthDate ? "default" : "muted"} variant="subtitle">
                  {birthDate ? formatBirthDate(birthDate) : "Fecha de nacimiento"}
                </AppText>
              </Pressable>
              {pickerOpen && Platform.OS === "ios" ? (
                <DateTimePicker
                  accentColor={colors.brand}
                  display="spinner"
                  locale="es-AR"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  mode="date"
                  onValueChange={(_event, date) => {
                    if (date) setBirthDate(date)
                  }}
                  themeVariant="dark"
                  value={birthDate ?? new Date(2000, 0, 1)}
                />
              ) : null}
            </Animated.View>
          ) : null}
        </View>
      </View>
    )
  },
)

function registerProblem(input: {
  email: string
  password: string
  repeatPassword: string
  firstName: string
  lastName: string
  birthDate: Date | null
}) {
  const email = input.email.trim().toLowerCase()
  if (!email) return "Escribí tu correo."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "El correo no es válido."
  if (!input.password) return "Escribí una contraseña."
  if (input.password.length < 6) return "La contraseña es demasiado corta. Usá al menos 6 caracteres."
  if (input.password !== input.repeatPassword) return "Las contraseñas no coinciden."
  if (!input.firstName.trim()) return "Escribí tu nombre."
  if (!input.lastName.trim()) return "Escribí tu apellido."
  if (!input.birthDate) return "Elegí tu fecha de nacimiento."
  return null
}

function toIsoDate(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${value.getFullYear()}-${month}-${day}`
}

function formatBirthDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value)
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
  details: {
    gap: 10,
  },
  dateRow: {
    backgroundColor: colors.field,
    borderRadius: radii.pill,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
})
