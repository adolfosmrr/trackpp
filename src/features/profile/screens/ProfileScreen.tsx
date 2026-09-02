import {
  View,
  ScrollView,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native"

import { supabase } from "../../../services/supabase"

import { useAuth } from "../../auth/context/AuthContext"
import { useProfile } from "../hooks/useProfile"
import { useHouseholds } from "../../households/hooks/useHouseholds"
import { useMe } from "../../auth/hooks/useMe"

import { useHouseholdStore } from "../../../store/householdStore"

export function ProfileScreen({ navigation, }: any) {
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

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (
    profileLoading ||
    householdsLoading ||
    backendUserLoading
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
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
        <Text>
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
    <ScrollView
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
          style={styles.inviteButton}
          onPress={() =>
            navigation
              .getParent()
              ?.navigate("InviteMember")
          }
        >
          <Text style={styles.inviteButtonText}>
            Invitar pareja
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
        style={styles.actionButton}
        onPress={() =>
          navigation
            .getParent()
            ?.navigate(
              "Invitations"
            )
        }
      >
        <Text
          style={styles.actionButtonText}
        >
          Ver invitaciones
        </Text>
      </Pressable>

      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Cerrar sesión
        </Text>
      </Pressable>
    </ScrollView>
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
  },

  content: {
    padding: 24,
    gap: 24,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
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
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
  },

  email: {
    fontSize: 14,
    color: "#777",
  },

  section: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },

  label: {
    color: "#777",
  },

  value: {
    flex: 1,
    textAlign: "right",
    fontWeight: "600",
  },

  separator: {
    height: 1,
    backgroundColor: "#eee",
  },

  logoutButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },

  logoutText: {
    fontWeight: "600",
    color: "#b42318",
  },
  inviteButton: {
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    alignItems: "center",
  },

  inviteButtonText: {
    fontWeight: "700",
  },
  actionButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    alignItems: "center",
  },
  
  actionButtonText: {
    fontWeight: "700",
  },
})
