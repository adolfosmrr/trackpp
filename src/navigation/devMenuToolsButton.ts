import { requireOptionalNativeModule } from "expo"
import type { NavigationState, PartialState } from "@react-navigation/native"

type NavState = NavigationState | PartialState<NavigationState>

type DevMenuPreferencesModule = {
  getPreferencesAsync: () => Promise<{
    showFloatingActionButton?: boolean
  }>
  setPreferencesAsync: (settings: {
    showFloatingActionButton: boolean
  }) => Promise<void>
}

const FORM_SHEET_ROUTES: ReadonlySet<string> = new Set([
  "BudgetEditor",
  "CategoryPicker",
  "CreateHousehold",
  "CreateMovement",
  "CurrencyPicker",
  "HouseholdPicker",
  "Profile",
  "TransactionFilters",
])

const preferences =
  requireOptionalNativeModule<DevMenuPreferencesModule>("DevMenuPreferences")

let held = false
let savedVisible = true
let pending: boolean | null = null
let running = false

function focusedRouteName(state: NavState | undefined): string | undefined {
  if (!state?.routes.length) return undefined
  const route = state.routes[state.index ?? 0]
  if (!route) return undefined
  if (route.state) return focusedRouteName(route.state) ?? route.name
  return route.name
}

function isFormSheet(routeName: string | undefined): boolean {
  return routeName != null && FORM_SHEET_ROUTES.has(routeName)
}

async function drain(): Promise<void> {
  if (running || !preferences) return
  const module = preferences
  running = true
  try {
    while (pending !== null) {
      const hide = pending
      pending = null
      if (hide) {
        if (held) continue
        const values = await module.getPreferencesAsync()
        if (pending !== null) continue
        savedVisible = values.showFloatingActionButton !== false
        held = true
        if (savedVisible) {
          await module.setPreferencesAsync({ showFloatingActionButton: false })
        }
      } else if (held) {
        const visible = savedVisible
        held = false
        if (visible) {
          await module.setPreferencesAsync({ showFloatingActionButton: true })
        }
      }
    }
  } catch {
    held = false
  } finally {
    running = false
    if (pending !== null) void drain()
  }
}

export function syncDevMenuToolsButton(
  state: NavigationState | undefined,
): void {
  if (!preferences) return
  pending = isFormSheet(focusedRouteName(state))
  void drain()
}
