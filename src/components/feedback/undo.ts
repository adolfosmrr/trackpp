type UndoRequest = {
  message: string
  actionLabel?: string
  onAction?: () => void
}

type UndoEntry = UndoRequest & { id: number }

const listeners = new Set<() => void>()
const HIDE_MS = 4500

let current: UndoEntry | null = null
let timer: ReturnType<typeof setTimeout> | null = null

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
  clearTimer()
  current = { ...request, id: Date.now() }
  emit()
  timer = setTimeout(() => {
    current = null
    timer = null
    emit()
  }, HIDE_MS)
}

export function runUndoAction() {
  const entry = current
  clearTimer()
  current = null
  emit()
  entry?.onAction?.()
}
