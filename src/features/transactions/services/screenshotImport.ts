import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"

import { ApiError, apiFetch } from "../../../services/api"
import type { ScreenshotImportResult, ScreenshotMovement } from "../types"

const MAX_EDGE = 1600
const JPEG_COMPRESS = 0.7
const SELECTION_LIMIT = 5

class ScreenshotImportError extends Error {
  constructor(readonly code: "IMAGE_UNREADABLE" | "NATIVE_BUILD_REQUIRED") {
    super(code)
    this.name = "ScreenshotImportError"
  }
}

export async function pickAndImportScreenshots(householdId: string) {
  let picked: ImagePicker.ImagePickerResult
  try {
    picked = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      quality: 1,
      selectionLimit: SELECTION_LIMIT,
    })
  } catch (error) {
    if (isMissingNativeModule(error)) {
      throw new ScreenshotImportError("NATIVE_BUILD_REQUIRED")
    }
    throw new ScreenshotImportError("IMAGE_UNREADABLE")
  }

  if (picked.canceled || picked.assets.length === 0) {
    return { status: "canceled" } as const
  }

  const images: Array<{ mimeType: "image/jpeg"; data: string }> = []
  for (const asset of picked.assets) {
    images.push(await compressScreenshot(asset))
  }

  const body = await apiFetch<unknown>("/ai/screenshot-movements", {
    method: "POST",
    body: JSON.stringify({ householdId, images }),
  })

  return {
    status: "imported" as const,
    result: parseImportResult(body),
  }
}

export function screenshotImportErrorMessage(error: unknown) {
  if (error instanceof ScreenshotImportError) {
    return error.code === "NATIVE_BUILD_REQUIRED"
      ? "Para elegir capturas hace falta una compilación nativa de la app."
      : "No pude leer la imagen."
  }

  if (error instanceof ApiError) {
    if (error.code === "IMAGE_UNREADABLE") return "No pude leer la imagen."
    if (error.code === "AI_DAILY_LIMIT_REACHED" || error.code === "MIGRATION_REQUIRED") {
      return error.message
    }
    if (error.status === 429) return "Espera un momento y vuelve a intentar."
    return "No se pudo conectar. Prueba de nuevo en un momento."
  }

  if (error instanceof TypeError) {
    return "No se pudo conectar. Prueba de nuevo en un momento."
  }

  return "No pude leer la imagen."
}

async function compressScreenshot(asset: ImagePicker.ImagePickerAsset) {
  try {
    const context = ImageManipulator.manipulate(asset.uri)
    const largest = Math.max(asset.width, asset.height)
    if (asset.width > 0 && asset.height > 0 && largest > MAX_EDGE) {
      const scale = MAX_EDGE / largest
      context.resize({
        width: Math.max(1, Math.round(asset.width * scale)),
        height: Math.max(1, Math.round(asset.height * scale)),
      })
    }

    const rendered = await context.renderAsync()
    const saved = await rendered.saveAsync({
      base64: true,
      compress: JPEG_COMPRESS,
      format: SaveFormat.JPEG,
    })

    if (!saved.base64) {
      throw new ScreenshotImportError("IMAGE_UNREADABLE")
    }

    return {
      mimeType: "image/jpeg" as const,
      data: saved.base64,
    }
  } catch (error) {
    if (error instanceof ScreenshotImportError) throw error
    if (isMissingNativeModule(error)) {
      throw new ScreenshotImportError("NATIVE_BUILD_REQUIRED")
    }
    throw new ScreenshotImportError("IMAGE_UNREADABLE")
  }
}

function parseImportResult(value: unknown): ScreenshotImportResult {
  if (!isRecord(value) || !Array.isArray(value.items) || !Array.isArray(value.duplicates)) {
    throw new ScreenshotImportError("IMAGE_UNREADABLE")
  }

  return {
    items: value.items.flatMap((item) => {
      const movement = parseMovement(item)
      return movement ? [movement] : []
    }),
    duplicates: value.duplicates.flatMap((item) => {
      const movement = parseMovement(item)
      return movement ? [movement] : []
    }),
  }
}

function parseMovement(value: unknown): ScreenshotMovement | null {
  if (!isRecord(value)) return null
  if (value.type !== "expense" && value.type !== "income") return null
  if (typeof value.title !== "string" || !value.title.trim()) return null
  if (typeof value.currency !== "string" || !/^[A-Za-z]{3}$/.test(value.currency)) return null
  if (typeof value.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return null
  if (value.time !== null && (typeof value.time !== "string" || !/^\d{2}:\d{2}:\d{2}$/.test(value.time))) {
    return null
  }

  const amount = typeof value.amount === "number" ? value.amount : Number(value.amount)
  if (!Number.isFinite(amount) || amount <= 0) return null

  return {
    title: value.title,
    amount,
    currency: value.currency.toUpperCase(),
    date: value.date,
    time: value.time,
    type: value.type,
  }
}

function isMissingNativeModule(error: unknown) {
  return error instanceof Error && /native module/i.test(error.message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
