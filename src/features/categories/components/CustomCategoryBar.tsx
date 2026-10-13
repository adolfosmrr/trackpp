import { useRef, useState } from "react"
import { StyleSheet, TextInput, View } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect"

import { CircleAddButton } from "../../../components/buttons/CircleAddButton"
import { AppText } from "../../../components/text/AppText"
import { colors, fonts, layout, radii } from "../../../theme"
import { createCategory } from "../services/categoryService"
import type { Category, CategoryType } from "../types"

const liquidGlassEnabled = isLiquidGlassAvailable() && isGlassEffectAPIAvailable()

type CustomCategoryBarProps = {
  householdId: string
  type: CategoryType
  categories: Category[] | undefined
  onCreated: (category: Category) => void
}

function firstGrapheme(value: string) {
  if (typeof Intl.Segmenter === "function") {
    const segment = new Intl.Segmenter(undefined, { granularity: "grapheme" })
      .segment(value)
      [Symbol.iterator]()
      .next().value
    return segment?.segment ?? ""
  }

  return Array.from(value)[0] ?? ""
}

function sameName(left: string, right: string) {
  return left.trim().toLocaleLowerCase("es") === right.trim().toLocaleLowerCase("es")
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
}

export function CustomCategoryBar({
  householdId,
  type,
  categories,
  onCreated,
}: CustomCategoryBarProps) {
  const queryClient = useQueryClient()
  const nameRef = useRef<TextInput>(null)
  const [emoji, setEmoji] = useState("")
  const [name, setName] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async (category) => {
      await queryClient.invalidateQueries({
        queryKey: ["categories", householdId, type],
      })
      setEmoji("")
      setName("")
      setErrorMessage(null)
      onCreated(category)
    },
    onError: (error) => {
      setErrorMessage(
        isUniqueViolation(error)
          ? "Ya existe una categoría con ese nombre."
          : "No se pudo crear la categoría.",
      )
    },
  })

  function save() {
    const trimmed = name.trim()
    if (!trimmed) {
      nameRef.current?.focus()
      return
    }

    const existing = categories?.find((category) => sameName(category.name, trimmed))
    if (existing) {
      onCreated(existing)
      return
    }

    setErrorMessage(null)
    createMutation.mutate({
      householdId,
      name: trimmed,
      icon: emoji || null,
      type,
    })
  }

  const fields = (
    <>
      <TextInput
        accessibilityLabel="Emoji de la categoría"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(value) => setEmoji(firstGrapheme(value))}
        placeholder="😀"
        placeholderTextColor={colors.mutedForeground}
        style={styles.emojiInput}
        value={emoji}
      />
      <View style={styles.divider} />
      <TextInput
        ref={nameRef}
        accessibilityLabel="Nombre de la categoría"
        onChangeText={(value) => {
          setName(value)
          setErrorMessage(null)
        }}
        onSubmitEditing={save}
        placeholder="Nueva categoría"
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="done"
        style={styles.nameInput}
        value={name}
      />
    </>
  )

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        {liquidGlassEnabled ? (
          <GlassView colorScheme="dark" glassEffectStyle="clear" style={styles.capsule}>
            {fields}
          </GlassView>
        ) : (
          <View style={[styles.capsule, styles.capsuleFallback]}>{fields}</View>
        )}
        <CircleAddButton
          accessibilityLabel="Crear categoría"
          disabled={createMutation.isPending}
          onPress={save}
        />
      </View>
      {errorMessage ? (
        <AppText tone="destructive" variant="caption">
          {errorMessage}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  block: {
    gap: layout.titleContentGap,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: layout.titleContentGap,
  },
  capsule: {
    alignItems: "center",
    borderRadius: radii.pill,
    flex: 1,
    flexDirection: "row",
    height: layout.headerPill,
    overflow: "hidden",
  },
  capsuleFallback: {
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  emojiInput: {
    color: colors.foreground,
    fontSize: 18,
    height: layout.headerPill,
    textAlign: "center",
    width: 48,
  },
  divider: {
    alignSelf: "stretch",
    backgroundColor: colors.divider,
    width: 1,
  },
  nameInput: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    height: layout.headerPill,
    paddingHorizontal: 12,
  },
})
