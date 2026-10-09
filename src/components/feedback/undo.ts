type UndoRequest = {
  message: string
  actionLabel?: string
  onAction?: () => void
  onExpire?: () => Promise<void>
}

type UndoEntry = UndoRequest & { id: number }

const listeners = new Set<() => void>()

let current: UndoEntry | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let expiring = false

function emit() {
  listeners.forEach((listener) => listener())
}

function clearTimer() {
  if (timer) clearTimeout(timer)
  timer = null
}

export function getUndoEntry() {
  return current
}

export function subscribeUndo(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function showUndo(request: UndoRequest) {
  const previous = current
  clearTimer()
  current = { ...request, id: Date.now() }
  emit()
  if (previous?.onExpire && !expiring) {
    void previous.onExpire()
  }
  timer = setTimeout(() => {
    void expireUndo()
  }, 4500)
}

export function runUndoAction() {
  const entry = current
  clearTimer()
  current = null
  emit()
  entry?.onAction?.()
}

export async function expireUndo() {
  const entry = current
  if (!entry || expiring) return
  expiring = true
  clearTimer()
  current = null
  emit()
  try {
    await entry.onExpire?.()
  } catch {
    entry.onAction?.()
    showUndo({ message: "No se pudo completar. Volvé a intentarlo." })
  } finally {
    expiring = false
  }
}
