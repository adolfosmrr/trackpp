import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import { BottomSheetScrollView } from "@gorhom/bottom-sheet"

import { colors, fonts, radii } from "../../../theme"
import { navigationRef } from "../../../navigation/navigationRef"
import { closeProfileMenu } from "../profileMenu"

import { supabase } from "../../../services/supabase"

import { useAuth } from "../../auth/context/AuthContext"
import { useProfile } from "../hooks/useProfile"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useMe } from "../../auth/hooks/useMe"

import { useHouseholdStore } from "../../../store/householdStore"

export function ProfileScreen() {
  const { user } = useAuth()

  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  const meQuery = useMe()
  const {
    data: backendUser,
    isLoading: backendUserLoading,
    error: backendUserError,
  } = meQuery

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
    closeProfileMenu()
    if (navigationRef.isReady()) navigationRef.navigate(name)
  }

  async function handleLogout() {
    closeProfileMenu()
    await supabase.auth.signOut()
  }

  if (
    profileLoading ||
    householdsLoading ||
    backendUserLoading
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    )
  }

  if (backendUserError) {
    console.error(
      "Backend /me error:",
      backendUserError
    )
  }

  if (
    profileError ||
    householdsError ||
    backendUserError
  ) {
    return (
      <View style={styles.center}>
        <Text style={styles.email}>
          No se pudo cargar el perfil.
        </Text>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            Cerrar sesión
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <BottomSheetScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(profile?.name)}
          </Text>
        </View>

        <Text style={styles.name}>
          {profile?.name ?? "Usuario"}
        </Text>

        <Text style={styles.email}>
          {user?.email ?? ""}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Preferencias
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>
            Moneda
          </Text>

          <Text style={styles.value}>
            {profile?.currency ?? "-"}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.label}>
            Zona horaria
          </Text>

          <Text style={styles.value}>
            {profile?.timezone ?? "-"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Espacio financiero
        </Text>

        <Pressable
          accessibilityRole="button"
          style={styles.inviteButton}
          onPress={() => openScreen("InviteMember")}
        >
          <Text style={styles.inviteButtonText}>
            Invitar pareja
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.inviteButton}
          onPress={() => openScreen("CreateHousehold")}
        >
          <Text style={styles.inviteButtonText}>
            Crear espacio
          </Text>
        </Pressable>

        <View style={styles.row}>
          <Text style={styles.label}>
            Espacio activo
          </Text>

          <Text style={styles.value}>
            {currentHousehold?.name ?? "Sin espacio"}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.label}>
            Tipo
          </Text>

          <Text style={styles.value}>
            {formatHouseholdType(
              currentHousehold?.type
            )}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Backend
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>
            ID
          </Text>

          <Text style={styles.value}>
            {backendUser?.id ?? "-"}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.label}>
            Email
          </Text>

          <Text style={styles.value}>
            {backendUser?.email ?? "-"}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        style={styles.actionButton}
        onPress={() => openScreen("Invitations")}
      >
        <Text
          style={styles.actionButtonText}
        >
          Ver invitaciones
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Cerrar sesión
        </Text>
      </Pressable>
    </BottomSheetScrollView>
  )
}

function getInitials(
  name: string | null | undefined
) {
  if (!name) {
    return "?"
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 24,
    gap: 24,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 24,
  },

  header: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.control,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  avatarText: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 24,
    fontWeight: "700",
  },

  name: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 24,
    fontWeight: "600",
  },

  email: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
  },

  section: {
    borderWidth: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 18,
    gap: 14,
  },

  sectionTitle: {
    color: colors.foreground,
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },

  label: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
  },

  value: {
    flex: 1,
    textAlign: "right",
    fontWeight: "600",
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
  },

  logoutButton: {
    minHeight: 44,
    padding: 16,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  logoutText: {
    fontWeight: "600",
    color: colors.destructive,
    fontFamily: fonts.sansMedium,
  },
  inviteButton: {
    marginTop: 8,
    minHeight: 44,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    alignItems: "center",
  },

  inviteButtonText: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontWeight: "600",
  },
  actionButton: {
    minHeight: 44,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    alignItems: "center",
  },
  
  actionButtonText: {
    color: colors.foreground,
    fontFamily: fonts.sansMedium,
    fontWeight: "600",
  },
})
