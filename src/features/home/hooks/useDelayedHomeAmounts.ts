import { useEffect, useRef, useState } from "react"

const DISPLAY_DELAY = 2000

export type HomeAmountValues = {
  balance: number
  income: number
  expenses: number
}

function areEqual(left: HomeAmountValues, right: HomeAmountValues) {
  return (
    left.balance === right.balance &&
    left.income === right.income &&
    left.expenses === right.expenses
  )
}

export function useDelayedHomeAmounts(
  values: HomeAmountValues,
  isFocused: boolean,
  ready: boolean,
) {
  const [displayedValues, setDisplayedValues] = useState(values)
  const displayedValuesRef = useRef(values)
  const latestValuesRef = useRef(values)
  const wasFocusedRef = useRef(isFocused)
  const initializedRef = useRef(false)
  const pendingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  latestValuesRef.current = values

  const clearPendingTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    pendingRef.current = false
  }

  const scheduleLatestValues = () => {
    clearPendingTimer()
    pendingRef.current = true
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      pendingRef.current = false

      const nextValues = latestValuesRef.current
      if (areEqual(nextValues, displayedValuesRef.current)) return

      displayedValuesRef.current = nextValues
      setDisplayedValues(nextValues)
    }, DISPLAY_DELAY)
  }

  useEffect(() => {
    if (!ready) {
      clearPendingTimer()
      wasFocusedRef.current = isFocused
      return
    }

    if (!initializedRef.current) {
      initializedRef.current = true
      displayedValuesRef.current = values
      setDisplayedValues(values)
      wasFocusedRef.current = isFocused
      return
    }

    const gainedFocus = !wasFocusedRef.current && isFocused
    wasFocusedRef.current = isFocused

    if (!isFocused) {
      clearPendingTimer()
      return
    }

    const valuesChanged = !areEqual(values, displayedValuesRef.current)
    if (!valuesChanged) {
      clearPendingTimer()
      return
    }

    if (gainedFocus || pendingRef.current) {
      scheduleLatestValues()
      return
    }

    displayedValuesRef.current = values
    setDisplayedValues(values)
  }, [isFocused, ready, values.balance, values.expenses, values.income])

  useEffect(() => () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
  }, [])

  return ready && !initializedRef.current ? values : displayedValues
}
