const PROVIDERS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "live.com",
  "hotmail.es",
  "yahoo.com.ar",
  "outlook.es",
  "protonmail.com",
] as const

const MAX_DISTANCE = 2

export function suggestedEmail(value: string) {
  const email = value.trim()
  const at = email.lastIndexOf("@")
  if (at <= 0 || email.indexOf("@") !== at) return null

  const local = email.slice(0, at)
  const domain = email.slice(at + 1).toLowerCase()
  if (!local || /\s/.test(local) || !isPlausibleDomain(domain)) return null
  if (PROVIDERS.some((provider) => provider === domain)) return null

  let best: { domain: string; distance: number } | null = null
  for (const provider of PROVIDERS) {
    if (Math.abs(provider.length - domain.length) > MAX_DISTANCE) continue
    const distance = damerauLevenshtein(domain, provider)
    if (distance === 0 || distance > MAX_DISTANCE) continue
    if (isDifferentName(domain, provider)) continue
    if (!best || distance < best.distance) best = { domain: provider, distance }
  }

  return best ? `${local}@${best.domain}` : null
}

function isPlausibleDomain(domain: string) {
  if (!/^[a-z0-9.-]+$/.test(domain)) return false
  const dot = domain.lastIndexOf(".")
  return dot > 0 && domain.length - dot >= 3 && !domain.includes("..")
}

function isDifferentName(typed: string, provider: string) {
  if (provider.length === typed.length + 1 && provider.slice(1) === typed) return true
  return provider.length === typed.length && provider.slice(1) === typed.slice(1)
}

function damerauLevenshtein(left: string, right: string) {
  const rows = left.length + 1
  const columns = right.length + 1
  const matrix = Array.from({ length: rows }, () => Array<number>(columns).fill(0))
  for (let row = 0; row < rows; row += 1) matrix[row][0] = row
  for (let column = 0; column < columns; column += 1) matrix[0][column] = column

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1
      let distance = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      )
      if (
        row > 1 &&
        column > 1 &&
        left[row - 1] === right[column - 2] &&
        left[row - 2] === right[column - 1]
      ) {
        distance = Math.min(distance, matrix[row - 2][column - 2] + 1)
      }
      matrix[row][column] = distance
    }
  }

  return matrix[left.length][right.length]
}
