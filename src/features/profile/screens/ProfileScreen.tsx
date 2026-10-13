import {
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { Button } from "../../../components/buttons/Button"
import { GlassButton } from "../../../components/buttons/GlassButton"
import { ProfileAvatar } from "../../../components/profile/ProfileAvatar"
import { SheetScaffold } from "../../../components/layout/SheetScaffold"
import { AppText } from "../../../components/text/AppText"
import { colors, radii } from "../../../theme"
import type { AppStackParamList } from "../../../navigation/types"

import { supabase } from "../../../services/supabase"

import { useAuth } from "../../auth/context/AuthContext"
import { PersonalInfoSection } from "../components/PersonalInfoSection"
import { useProfile } from "../hooks/useProfile"
import { useHouseholds } from "../../households/hooks/useHouseholds"

import { useHouseholdStore } from "../../../store/householdStore"

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const { user } = useAuth()

  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  const profileQuery = useProfile()
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = profileQuery

  const householdsQuery = useHouseholds()
  const {
    data: memberships,
    isLoading: householdsLoading,
    error: householdsError,
  } = householdsQuery

  const currentHousehold = memberships?.find(
    (membership) =>
      membership.household.id === selectedHouseholdId
  )?.household

  function openScreen(name: "InviteMember" | "CreateHousehold" | "Invitations") {
    navigation.navigate(name)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function close() {
    navigation.goBack()
  }

  if (profileLoading || householdsLoading) {
    return (
      <SheetScaffold onClose={close} title="Perfil">
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SheetScaffold>
    )
  }

  if (profileError || householdsError) {
    return (
      <SheetScaffold onClose={close} title="Perfil">
        <View style={styles.center}>
          <AppText tone="muted" variant="body">
            No se pudo cargar el perfil.
          </AppText>

          <Button label="Cerrar sesión" onPress={handleLogout} tone="destructive" />
        </View>
      </SheetScaffold>
    )
  }

  return (
    <SheetScaffold onClose={close} title="Perfil">
      <View style={styles.header}>
        <ProfileAvatar
          name={profile?.name}
          style={styles.avatar}
          uri={profile?.avatar_url}
          variant="title"
        />

        <AppText variant="title">
          {profile?.name ?? "Usuario"}
        </AppText>

        <AppText tone="muted" variant="caption">
          {user?.email ?? ""}
        </AppText>
      </View>

      {profile ? (
        <PersonalInfoSection email={user?.email ?? ""} profile={profile} />
      ) : null}

      <View style={styles.section}>
        <AppText variant="sectionTitle">
          Preferencias
        </AppText>

        <View style={styles.row}>
          <AppText tone="muted" variant="body">
            Moneda
          </AppText>

          <AppText style={styles.value} variant="subtitle">
            {profile?.currency ?? "-"}
          </AppText>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <AppText tone="muted" variant="body">
            Zona horaria
          </AppText>

          <AppText style={styles.value} variant="subtitle">
            {profile?.timezone ?? "-"}
          </AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="sectionTitle">
          Espacio financiero
        </AppText>

        <GlassButton
          accessibilityLabel="Invitar pareja"
          label="Invitar pareja"
          onPress={() => openScreen("InviteMember")}
        />

        <GlassButton
          accessibilityLabel="Crear espacio"
          label="Crear espacio"
          onPress={() => openScreen("CreateHousehold")}
        />

        <View style={styles.row}>
          <AppText tone="muted" variant="body">
            Espacio activo
          </AppText>

          <AppText style={styles.value} variant="subtitle">
            {currentHousehold?.name ?? "Sin espacio"}
          </AppText>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <AppText tone="muted" variant="body">
            Tipo
          </AppText>

          <AppText style={styles.value} variant="subtitle">
            {formatHouseholdType(
              currentHousehold?.type
            )}
          </AppText>
        </View>
      </View>

      <GlassButton
        accessibilityLabel="Ver invitaciones"
        label="Ver invitaciones"
        onPress={() => openScreen("Invitations")}
      />

      <Button label="Cerrar sesión" onPress={handleLogout} tone="destructive" />
    </SheetScaffold>
  )
}

function formatHouseholdType(
  type: string | undefined
) {
  if (type === "personal") {
    return "Personal"
  }

  if (type === "couple") {
    return "Pareja"
  }

  return "-"
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    gap: 20,
    justifyContent: "center",
    minHeight: 160,
  },

  header: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },

  avatar: {
    borderRadius: 36,
    height: 72,
    marginBottom: 4,
    width: 72,
  },

  section: {
    borderWidth: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 18,
    gap: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },

  value: {
    flex: 1,
    textAlign: "right",
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
})
