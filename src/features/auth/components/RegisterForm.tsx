import { forwardRef, useEffect, useImperativeHandle, useState, type ReactNode } from "react"
import { Alert, Platform, Pressable, StyleSheet } from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useReducedMotion,
} from "react-native-reanimated"

import { SymbolIcon } from "../../../components/icons/SymbolIcon"
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

function detailMotion(reducedMotion: boolean) {
  return reducedMotion ? undefined : LinearTransition.duration(280)
}

export const RegisterForm = forwardRef<RegisterFormHandle, RegisterFormProps>(
  function RegisterForm({ onLoadingChange }, ref) {
    const reducedMotion = useReducedMotion() === true
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [repeatPassword, setRepeatPassword] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [birthDate, setBirthDate] = useState<Date | null>(null)
    const [pickerOpen, setPickerOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const revealDetails = password.length > 0
    const layout = detailMotion(reducedMotion)

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
      <Animated.View layout={layout} style={styles.inputsContainer}>
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
          <>
            <DetailField index={0} reducedMotion={reducedMotion}>
              <TextField
                onChangeText={setRepeatPassword}
                placeholder="Repetir contraseña"
                secureTextEntry
                trailing={repeatPassword.length > 0 ? (
                  <PasswordMatchIcon matches={repeatPassword === password} />
                ) : null}
                value={repeatPassword}
              />
            </DetailField>
            <DetailField index={1} reducedMotion={reducedMotion}>
              <TextField
                autoCapitalize="words"
                onChangeText={setFirstName}
                placeholder="Nombre"
                value={firstName}
              />
            </DetailField>
            <DetailField index={2} reducedMotion={reducedMotion}>
              <TextField
                autoCapitalize="words"
                onChangeText={setLastName}
                placeholder="Apellido"
                value={lastName}
              />
            </DetailField>
            <DetailField index={3} reducedMotion={reducedMotion}>
              <Pressable accessibilityRole="button" onPress={openBirthDate} style={styles.dateRow}>
                <AppText tone={birthDate ? "default" : "muted"} variant="subtitle">
                  {birthDate ? formatBirthDate(birthDate) : "Fecha de nacimiento"}
                </AppText>
              </Pressable>
              {pickerOpen && Platform.OS === "ios" ? (
                <Animated.View
                  entering={reducedMotion ? undefined : FadeIn.duration(220)}
                  exiting={reducedMotion ? undefined : FadeOut.duration(160)}
                  layout={layout}
                  style={styles.pickerCard}
                >
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
                    style={styles.picker}
                    themeVariant="dark"
                    value={birthDate ?? new Date(2000, 0, 1)}
                  />
                </Animated.View>
              ) : null}
            </DetailField>
          </>
        ) : null}
      </Animated.View>
    )
  },
)

function DetailField({
  children,
  index,
  reducedMotion,
}: {
  children: ReactNode
  index: number
  reducedMotion: boolean
}) {
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(280).delay(index * 70)}
      exiting={reducedMotion ? undefined : FadeOut.duration(160)}
      layout={detailMotion(reducedMotion)}
      style={styles.detailItem}
    >
      {children}
    </Animated.View>
  )
}

function PasswordMatchIcon({ matches }: { matches: boolean }) {
  return (
    <SymbolIcon
      color={matches ? colors.brand : colors.destructive}
      fallback={matches ? "✓" : "×"}
      name={matches
        ? { ios: "checkmark", android: "check", web: "check" }
        : { ios: "xmark", android: "close", web: "close" }}
    />
  )
}

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
  inputsContainer: {
    gap: 10,
    marginBottom: 20,
    width: "100%",
  },
  detailItem: {
    gap: 10,
    width: "100%",
  },
  dateRow: {
    backgroundColor: colors.field,
    borderRadius: radii.pill,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  pickerCard: {
    backgroundColor: colors.field,
    borderRadius: radii.lg,
    overflow: "hidden",
    width: "100%",
  },
  picker: {
    backgroundColor: colors.field,
    width: "100%",
  },
})
