export const SPACE_MENU_LABEL = "Cambiar cuenta"
export const CREATE_SPACE_LABEL = "+ Crear Espacio"

export type SpaceMenuItem = {
  id: string
  name: string
  subtitle: string
  selected: boolean
}

export type SpaceMenuProps = {
  compact: boolean
  label: string
  items: readonly SpaceMenuItem[]
  onSelect: (id: string) => void
  onCreate: () => void
}

export function spaceSubtitle(type: string, currency: string) {
  const kind = type === "personal" ? "Personal" : "Compartido"
  const code = currency.trim().toUpperCase() || "ARS"
  return `${kind} · ${code}`
}
