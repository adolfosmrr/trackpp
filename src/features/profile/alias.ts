const ALIAS_PATTERN = /^[a-z][a-z0-9_]{2,19}$/

export function normalizeAlias(value: string) {
  return value.trim().toLowerCase()
}

export function aliasFormatError(value: string) {
  const alias = normalizeAlias(value)
  if (!alias) return null
  if (!ALIAS_PATTERN.test(alias)) {
    return "Usa de 3 a 20 caracteres: empieza con una letra y sigue con letras, números o _."
  }
  return null
}
