import {
  ImageManipulator,
  SaveFormat,
  type ImageManipulatorContext,
  type ImageRef,
} from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"

import { ApiError, apiFetch } from "../../../services/api"
import { parseClockTime, parseLocalDate, toLocalDateString } from "../../../utils/localDate"
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
      orderedSelection: true,
      quality: 1,
      selectionLimit: SELECTION_LIMIT,
      shouldDownloadFromNetwork: true,
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
  let context: ImageManipulatorContext | null = null
  let measured: ImageRef | null = null
  let rendered: ImageRef | null = null
  try {
    context = ImageManipulator.manipulate(asset.uri)
    let width = asset.width
    let height = asset.height
    if (width <= 0 || height <= 0) {
      measured = await context.renderAsync()
      width = measured.width
      height = measured.height
    }

    const largest = Math.max(width, height)
    if (width > 0 && height > 0 && largest > MAX_EDGE) {
      const scale = MAX_EDGE / largest
      context.resize({
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
      })
      rendered = await context.renderAsync()
    } else {
      rendered = measured ?? (await context.renderAsync())
    }

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
  } finally {
    if (rendered && rendered !== measured) releaseNative(rendered)
    releaseNative(measured)
    releaseNative(context)
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
  if (typeof value.title !== "string") return null
  const title = value.title.trim()
  if (!title) return null
  if (typeof value.currency !== "string") return null
  const currency = value.currency.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) return null
  if (typeof value.date !== "string") return null
  const parsedDate = parseLocalDate(value.date)
  if (!parsedDate || toLocalDateString(parsedDate) !== value.date) return null
  if (value.time !== null && (typeof value.time !== "string" || parseClockTime(value.time) !== value.time)) {
    return null
  }
  const time = typeof value.time === "string" ? value.time : null

  const amount = typeof value.amount === "number" ? value.amount : Number(value.amount)
  if (!Number.isFinite(amount) || amount <= 0) return null

  return {
    title,
    amount,
    currency,
    date: value.date,
    time,
    type: value.type,
  }
}

function releaseNative(resource: { release: () => void } | null) {
  if (!resource) return
  try {
    resource.release()
  } catch {
    // The bitmap is already being discarded.
  }
}

function isMissingNativeModule(error: unknown) {
  return error instanceof Error && /native module/i.test(error.message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
