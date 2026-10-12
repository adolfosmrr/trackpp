import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
  } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts, radii } from "../../../theme"

import { Button } from "../../../components/buttons/Button"
import { BackLink } from "../../../components/navigation/BackLink"
  
  import {
    useInvitations,
  } from "../hooks/useInvitations"
  
  import {
    useAcceptInvitation,
  } from "../hooks/useAcceptInvitation"
  import type { AppStackParamList } from "../../../navigation/types"
  
  export function InvitationsScreen({
    navigation,
  }: NativeStackScreenProps<AppStackParamList, "Invitations">) {
    const insets = useSafeAreaInsets()
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
        <View style={[styles.container, { paddingTop: insets.top + 16, paddingHorizontal: 24 }]}>
          <BackLink onPress={() => navigation.goBack()} />
          <View style={styles.center}>
            <ActivityIndicator
              color={colors.brand}
              size="large"
            />
          </View>
        </View>
      )
    }
  
    if (error) {
      return (
        <View style={[styles.container, { paddingTop: insets.top + 16, paddingHorizontal: 24 }]}>
          <BackLink onPress={() => navigation.goBack()} />
          <View style={styles.center}>
            <Text style={styles.empty}>
              No se pudieron cargar las invitaciones.
            </Text>
          </View>
        </View>
      )
    }
  
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <BackLink onPress={() => navigation.goBack()} />
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
  
                <Button
                  disabled={acceptMutation.isPending}
                  label={acceptMutation.isPending ? "Aceptando..." : "Aceptar invitación"}
                  onPress={() => handleAccept(invitation.id)}
                  tone="brand"
                />
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
        backgroundColor: colors.background,
      },
  
      content: {
        padding: 24,
        gap: 18,
        paddingBottom: 100,
      },
  
      center: {
        flex: 1,
        alignItems: "center",
        backgroundColor: colors.background,
        justifyContent: "center",
        padding: 24,
      },
  
      title: {
        fontSize: 26,
        fontWeight: "600",
        color: colors.foreground,
        fontFamily: fonts.sansSemibold,
      },
  
      empty: {
        color: colors.mutedForeground,
        fontFamily: fonts.sans,
        textAlign: "center",
        marginTop: 40,
      },
  
      card: {
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        backgroundColor: colors.card,
        gap: 12,
      },
  
      householdName: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.foreground,
        fontFamily: fonts.sansSemibold,
      },
  
      description: {
        color: colors.mutedForeground,
        fontFamily: fonts.sans,
        lineHeight: 20,
      },
  
    })