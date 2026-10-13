import AsyncStorage from "@react-native-async-storage/async-storage"

import type { CreateMovementMode } from "../types"

const MODE_KEY = "trackpp.lastEntryMode"
const CATEGORY_KEY = "trackpp.lastEntryCategory"

type CategoryMap = Record<string, string>

function categoryKey(householdId: string, mode: CreateMovementMode) {
  return `${householdId}:${mode}`
}

export async function getLastEntryMode(): Promise<CreateMovementMode> {
  try {
    const value = await AsyncStorage.getItem(MODE_KEY)
    if (value === "expense" || value === "income" || value === "fixed") return value
  } catch {
    // A missing preference just falls back to gasto.
  }
  return "expense"
}

export async function setLastEntryMode(mode: CreateMovementMode) {
  try {
    await AsyncStorage.setItem(MODE_KEY, mode)
  } catch {
    // Persistence is a convenience; saving the movement still works.
  }
}

export async function getLastCategoryId(householdId: string, mode: CreateMovementMode) {
  try {
    const raw = await AsyncStorage.getItem(CATEGORY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CategoryMap
    const value = parsed[categoryKey(householdId, mode)]
    return typeof value === "string" ? value : null
  } catch {
    return null
  }
}

export async function setLastCategoryId(
  householdId: string,
  mode: CreateMovementMode,
  categoryId: string,
) {
  try {
    const raw = await AsyncStorage.getItem(CATEGORY_KEY)
    const parsed = raw ? (JSON.parse(raw) as CategoryMap) : {}
    parsed[categoryKey(householdId, mode)] = categoryId
    await AsyncStorage.setItem(CATEGORY_KEY, JSON.stringify(parsed))
  } catch {
    // Same as the mode preference: ignore storage failures.
  }
}
