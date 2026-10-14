import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useIsFocused } from "@react-navigation/native"
import * as WebBrowser from "expo-web-browser"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { SymbolIcon } from "../../../components/icons/SymbolIcon"
import { FieldRow, TextField } from "../../../components/inputs/TextField"
import { BackLink } from "../../../components/navigation/BackLink"
import { AppText } from "../../../components/text/AppText"
import { GradientBackground } from "../../../components/visual/GradientBackground"
import type { AuthStackParamList } from "../../../navigation/types"
import { supabase } from "../../../services/supabase"
import { colors, layout, radii } from "../../../theme"
import { AuthEmailField } from "../components/AuthEmailField"
import { PrimaryAuthButton } from "../components/PrimaryAuthButton"
import { useAppIsActive } from "../hooks/useAppIsActive"
import { AUTH_REDIRECT_URL } from "../services/authCallback"
import { authErrorMessage } from "../services/authErrors"

const PRIVACY_URL = "https://adolfosmrr.github.io/trackpp/privacy.html"

type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, "SignUp">

export function SignUpScreen({ navigation }: SignUpScreenProps) {
  const insets = useSafeAreaInsets()
  const isFocused = useIsFocused()
  const appIsActive = useAppIsActive()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [loading, setLoading] = useState(false)

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
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: insets.bottom + layout.sheetPadding,
              paddingTop: insets.top + layout.titleContentGap,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          style={styles.avoider}
        >
          <BackLink onPress={() => navigation.goBack()} />
          <View style={styles.fields}>
            <TextField
              autoCapitalize="words"
              onChangeText={setFirstName}
              placeholder="Nombres"
              value={firstName}
            />
            <TextField
              autoCapitalize="words"
              onChangeText={setLastName}
              placeholder="Apellido"
              value={lastName}
            />
            {Platform.OS === "web" ? (
              <TextField
                autoCapitalize="none"
                onChangeText={(value) => setBirthDate(parseDateInput(value))}
                placeholder="Fecha de nacimiento (AAAA-MM-DD)"
                value={birthDate ? toIsoDate(birthDate) : ""}
              />
            ) : (
              <FieldRow accessibilityLabel="Fecha de nacimiento" onPress={openBirthDate}>
                <AppText tone={birthDate ? "default" : "muted"} variant="subtitle">
                  {birthDate ? formatBirthDate(birthDate) : "Fecha de nacimiento"}
                </AppText>
              </FieldRow>
            )}
            {pickerOpen && Platform.OS === "ios" ? (
              <View style={styles.pickerCard}>
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
              </View>
            ) : null}
            <AuthEmailField
              onChangeText={setEmail}
              placeholder="Email"
              value={email}
            />
            <TextField
              onChangeText={setPassword}
              placeholder="Contraseña"
              secureTextEntry
              value={password}
            />
            <TextField
              onChangeText={setRepeatPassword}
              placeholder="Repetir contraseña"
              secureTextEntry
              trailing={repeatPassword.length > 0 ? (
                <PasswordMatchIcon matches={repeatPassword === password} />
              ) : null}
              value={repeatPassword}
            />
          </View>
          <PrimaryAuthButton
            label="Crear cuenta"
            loading={loading}
            loadingLabel="Creando..."
            onPress={() => {
              void handleRegister()
            }}
          />
          <AppText style={styles.policies} tone="muted" variant="caption">
            Al crear la cuenta aceptás nuestras{" "}
            <AppText
              accessibilityRole="link"
              onPress={() => {
                void WebBrowser.openBrowserAsync(PRIVACY_URL)
              }}
              style={styles.policyLink}
              variant="caption"
            >
              políticas
            </AppText>
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  if (!input.firstName.trim()) return "Escribí tu nombre."
  if (!input.lastName.trim()) return "Escribí tu apellido."
  if (!input.birthDate) return "Elegí tu fecha de nacimiento."
  if (!email) return "Escribí tu correo."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "El correo no es válido."
  if (!input.password) return "Escribí una contraseña."
  if (input.password.length < 6) return "La contraseña es demasiado corta. Usá al menos 6 caracteres."
  if (input.password !== input.repeatPassword) return "Las contraseñas no coinciden."
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

function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isInteger(year) || month < 1 || month > 12 || day < 1 || day > 31) return null
  return new Date(year, month - 1, day)
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  avoider: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: layout.titleContentGap,
    paddingHorizontal: layout.sheetPadding,
    zIndex: 1,
  },
  fields: {
    gap: 10,
    width: "100%",
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
  policies: {
    textAlign: "center",
  },
  policyLink: {
    color: colors.brand,
  },
})
