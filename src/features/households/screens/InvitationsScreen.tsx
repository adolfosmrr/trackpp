import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
  } from "react-native"
  
  import {
    useInvitations,
  } from "../hooks/useInvitations"
  
  import {
    useAcceptInvitation,
  } from "../hooks/useAcceptInvitation"
  
  export function InvitationsScreen({
    navigation,
  }: any) {
    const {
      data: invitations,
      isLoading,
      error,
    } = useInvitations()
  
    const acceptMutation =
      useAcceptInvitation()
  
    async function handleAccept(
      invitationId: string
    ) {
      try {
        await acceptMutation.mutateAsync(
          invitationId
        )
  
        Alert.alert(
          "Invitación aceptada",
          "Ya formas parte del espacio compartido.",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.goBack(),
            },
          ]
        )
      } catch (error) {
        const message =
          error instanceof Error
            ? parseApiError(
                error.message
              )
            : "No se pudo aceptar la invitación."
  
        Alert.alert(
          "Error",
          message
        )
      }
    }
  
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
          />
        </View>
      )
    }
  
    if (error) {
      return (
        <View style={styles.center}>
          <Text>
            No se pudieron cargar las invitaciones.
          </Text>
        </View>
      )
    }
  
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.content
        }
      >
        <Text style={styles.title}>
          Invitaciones
        </Text>
  
        {!invitations?.length ? (
          <Text style={styles.empty}>
            No tienes invitaciones pendientes.
          </Text>
        ) : (
          invitations.map(
            (invitation) => (
              <View
                key={invitation.id}
                style={styles.card}
              >
                <Text
                  style={
                    styles.householdName
                  }
                >
                  {invitation
                    .household
                    .name}
                </Text>
  
                <Text
                  style={
                    styles.description
                  }
                >
                  Te invitaron a unirte
                  a este espacio
                  financiero.
                </Text>
  
                <Pressable
                  style={[
                    styles.button,
  
                    acceptMutation.isPending &&
                      styles.buttonDisabled,
                  ]}
                  disabled={
                    acceptMutation.isPending
                  }
                  onPress={() =>
                    handleAccept(
                      invitation.id
                    )
                  }
                >
                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    {acceptMutation.isPending
                      ? "Aceptando..."
                      : "Aceptar invitación"}
                  </Text>
                </Pressable>
              </View>
            )
          )
        )}
      </ScrollView>
    )
  }
  
  function parseApiError(
    message: string
  ) {
    try {
      const parsed =
        JSON.parse(message)
  
      if (
        typeof parsed.error ===
        "string"
      ) {
        return parsed.error
      }
    } catch {}
  
    return message
  }
  
  const styles =
    StyleSheet.create({
      container: {
        flex: 1,
      },
  
      content: {
        padding: 24,
        gap: 18,
        paddingBottom: 100,
      },
  
      center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      },
  
      title: {
        fontSize: 26,
        fontWeight: "700",
      },
  
      empty: {
        color: "#777",
        textAlign: "center",
        marginTop: 40,
      },
  
      card: {
        padding: 18,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 16,
        gap: 12,
      },
  
      householdName: {
        fontSize: 20,
        fontWeight: "700",
      },
  
      description: {
        color: "#777",
        lineHeight: 20,
      },
  
      button: {
        padding: 14,
        backgroundColor: "#111",
        borderRadius: 10,
        alignItems: "center",
      },
  
      buttonDisabled: {
        opacity: 0.6,
      },
  
      buttonText: {
        color: "#fff",
        fontWeight: "700",
      },
    })