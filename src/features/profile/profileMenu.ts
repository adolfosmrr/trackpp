let presentMenu: (() => void) | null = null
let dismissMenu: (() => void) | null = null

export function registerProfileMenu(present: () => void, dismiss: () => void) {
  presentMenu = present
  dismissMenu = dismiss
  return () => {
    if (presentMenu === present) presentMenu = null
    if (dismissMenu === dismiss) dismissMenu = null
  }
}

export function openProfileMenu() {
  presentMenu?.()
}

export function closeProfileMenu() {
  dismissMenu?.()
}
