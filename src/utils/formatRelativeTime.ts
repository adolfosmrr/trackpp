export function formatRelativeTime(value: string) {
  const date = new Date(value)
  const timestamp = date.getTime()

  if (Number.isNaN(timestamp)) {
    return "Ahora"
  }

  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff <= 60_000) {
    return "Ahora"
  }

  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) {
    return `Hace ${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `Hace ${hours} h`
  }

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime()
  const daysAgo = Math.floor(
    (startOfToday - startOfDate) / 86_400_000
  )

  if (daysAgo === 1) {
    return "Ayer"
  }

  if (daysAgo >= 2 && daysAgo < 7) {
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
    }).format(date)
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  })
    .format(date)
    .replace(".", "")
}
