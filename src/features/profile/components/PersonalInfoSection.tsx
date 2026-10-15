import { useEffect, useState } from "react"
import { Platform, StyleSheet, View } from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "../../../components/buttons/Button"
import { FieldRow, TextField } from "../../../components/inputs/TextField"
import { AppText } from "../../../components/text/AppText"
import { supabase } from "../../../services/supabase"
import { colors, layout, radii } from "../../../theme"
import { isEmail } from "../../../utils/isEmail"
import { formatLongDate, parseLocalDate, toLocalDateString } from "../../../utils/localDate"
import { useAuth } from "../../auth/context/AuthContext"
import { aliasFormatError, normalizeAlias } from "../alias"
import { updateProfile, type Profile } from "../services/profileService"

type PersonalInfoSectionProps = {
  profile: Profile
  email: string
}

export function PersonalInfoSection({ profile, email }: PersonalInfoSectionProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState(profile.name ?? "")
  const [lastName, setLastName] = useState(profile.last_name ?? "")
  const [alias, setAlias] = useState(profile.alias ?? "")
  const [birthDate, setBirthDate] = useState<Date | null>(parseLocalDate(profile.birth_date))
  const [nextEmail, setNextEmail] = useState(email)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setName(profile.name ?? "")
    setLastName(profile.last_name ?? "")
    setAlias(profile.alias ?? "")
    setBirthDate(parseLocalDate(profile.birth_date))
  }, [profile.alias, profile.birth_date, profile.last_name, profile.name])

  useEffect(() => {
    setNextEmail(email)
  }, [email])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuario no autenticado.")
      const formatError = aliasFormatError(alias)
      if (formatError) throw new Error(formatError)

      const trimmedEmail = nextEmail.trim().toLowerCase()
      if (!isEmail(trimmedEmail)) throw new Error("El correo no es válido.")

      await updateProfile(user.id, {
        name: name.trim() || null,
        lastName: lastName.trim() || null,
        birthDate: birthDate ? toLocalDateString(birthDate) : null,
        alias: normalizeAlias(alias) || null,
      })

      if (trimmedEmail !== email.trim().toLowerCase()) {
        const { error } = await supabase.auth.updateUser({ email: trimmedEmail })
        if (error) throw new Error("No se pudo actualizar el correo.")
        return trimmedEmail
      }

      return null
    },
    onSuccess: async (confirmedEmail) => {
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.id] })
      if (confirmedEmail) setNextEmail(email)
      setErrorMessage(null)
      setPickerOpen(false)
      setNotice(
        confirmedEmail
          ? `Te enviamos un correo a ${confirmedEmail} para confirmar el cambio. Hasta que lo confirmes, sigues entrando con el correo actual.`
          : "Guardamos tus datos.",
      )
    },
    onError: (error) => {
      setNotice(null)
      setErrorMessage(profileErrorMessage(error))
    },
  })

  function openBirthDate() {
    const value = birthDate ?? new Date(1990, 0, 1)
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value,
        mode: "date",
        maximumDate: new Date(),
        minimumDate: new Date(1900, 0, 1),
        onValueChange: (_event, date) => setBirthDate(date),
      })
      return
    }
    setPickerOpen((open) => !open)
  }

  return (
    <View style={styles.section}>
      <AppText variant="sectionTitle">Información personal</AppText>
      <TextField
        accessibilityLabel="Nombre"
        autoCapitalize="words"
        onChangeText={setName}
        placeholder="Nombre"
        value={name}
      />
      <TextField
        accessibilityLabel="Apellido"
        autoCapitalize="words"
        onChangeText={setLastName}
        placeholder="Apellido"
        value={lastName}
      />
      <FieldRow accessibilityLabel="Fecha de nacimiento" onPress={openBirthDate}>
        <AppText tone={birthDate ? "default" : "muted"} variant="subtitle">
          {birthDate ? formatLongDate(birthDate) : "Fecha de nacimiento"}
        </AppText>
      </FieldRow>
      {pickerOpen && Platform.OS === "ios" ? (
        <DateTimePicker
          accentColor={colors.brand}
          display="spinner"
          locale="es-AR"
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          mode="date"
          onValueChange={(_event, date) => setBirthDate(date)}
          style={styles.picker}
          themeVariant="dark"
          value={birthDate ?? new Date(1990, 0, 1)}
        />
      ) : null}
      {pickerOpen && Platform.OS === "web" ? (
        <TextField
          accessibilityLabel="Fecha de nacimiento"
          autoCapitalize="none"
          onChangeText={(value) => setBirthDate(parseLocalDate(value))}
          placeholder="AAAA-MM-DD"
          value={birthDate ? toLocalDateString(birthDate) : ""}
        />
      ) : null}
      {birthDate ? (
        <Button
          label="Quitar fecha"
          onPress={() => {
            setBirthDate(null)
            setPickerOpen(false)
          }}
          size="compact"
          tone="ghost"
        />
      ) : null}
      <TextField
        accessibilityLabel="Alias"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setAlias}
        placeholder="Alias"
        value={alias}
      />
      <AppText tone="muted" variant="caption">
        De 3 a 20 caracteres y único: empieza con una letra y sigue con letras, números o _. Sirve para que otras personas te inviten.
      </AppText>
      <TextField
        accessibilityLabel="Correo"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        onChangeText={setNextEmail}
        placeholder="correo@ejemplo.com"
        value={nextEmail}
      />
      <AppText tone="muted" variant="caption">
        Si cambias el correo, te mandamos un mensaje para confirmarlo. Hasta que lo confirmes, sigues con el correo actual.
      </AppText>
      {errorMessage ? (
        <AppText tone="destructive" variant="caption">{errorMessage}</AppText>
      ) : null}
      {notice ? <AppText tone="brand" variant="caption">{notice}</AppText> : null}
      <Button
        disabled={saveMutation.isPending || aliasFormatError(alias) !== null}
        label={saveMutation.isPending ? "Guardando..." : "Guardar"}
        onPress={() => {
          setErrorMessage(null)
          saveMutation.mutate()
        }}
        tone="brand"
      />
    </View>
  )
}

function profileErrorMessage(error: unknown) {
  if (hasCode(error, "23505")) return "Ese alias ya está en uso."
  if (hasCode(error, "23514")) return "Revisa el alias o la fecha de nacimiento."
  if (error instanceof Error && error.message) return error.message
  return "No se pudo guardar."
}

function hasCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  )
}

const styles = StyleSheet.create({
  picker: {
    width: "100%",
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: layout.titleContentGap,
    padding: layout.sheetPadding,
  },
})
