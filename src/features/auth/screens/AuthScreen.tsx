import { useState } from "react"
import { StyleSheet, View } from "react-native"

import { GridBackground } from "../../../components/layout/GridBackground"
import AnimatedText from "../../../components/text/AnimatedText"
import { MeshGradient } from "../../../components/visual/MeshGradient"
import { AuthToggle, type AuthMode } from "../components/AuthToggle"
import { LoginForm } from "../components/LoginForm"
import { RegisterForm } from "../components/RegisterForm"

const SHOW_MESH_GRADIENT = false

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login")

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode)
  }

  return (
    <View style={styles.container}>
      {SHOW_MESH_GRADIENT ? (
        <MeshGradient
          colors={["#00ABBB", "#FD9785", "#FFF", "#FFF"]}
          speed={0.5}
          blur={0.5}
          noise={0.3}
          intensity={1}
          animated
          style={styles.meshBackground}
        />
      ) : null}
      <GridBackground />

      <View style={styles.content}>
        <View style={styles.authMessageClip}>
          <AnimatedText
            text={
              mode === "login"
                ? "¡Hola! ¡Bienvenido de vuelta!"
                : "¡Hola persona que aún no conozco!"
            }
            animationConfig={{
              spring: {
                damping: 18,
                stiffness: 280,
                mass: 1,
              },
              characterDelay: 15,
            }}
            enterFrom={{
              opacity: 0,
              translateY: 16,
              scale: 0.8,
              rotate: 5,
            }}
            exitFrom={{
              opacity: 1,
              translateY: 0,
              scale: 1,
              rotate: 0,
            }}
            style={styles.authMessage}
          />
        </View>
        <AuthToggle value={mode} onChange={handleModeChange} />
        {mode === "login" ? (
          <LoginForm onRequestRegister={() => setMode("register")} />
        ) : (
          <RegisterForm onRequestLogin={() => setMode("login")} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meshBackground: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  authMessage: {
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 45,
    lineHeight: 42,
    color: "#8E8E8E",
  },
  authMessageClip: {
    width: "100%",
    minHeight: 40,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
})
