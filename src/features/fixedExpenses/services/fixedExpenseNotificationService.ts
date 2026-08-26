import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

import { resolveMonthlyDay } from "../utils/monthlyDate"
import type { FixedExpense, FixedExpensePeriod } from "../types"
import {
  getNotificationPermissionStatus,
} from "../../notifications/services/notificationPermissionService"
import {
  loadScheduledFixedExpenseNotifications,
  saveScheduledFixedExpenseNotifications,
  type FixedExpenseNotificationType,
  type ScheduledFixedExpenseNotification,
} from "./fixedExpenseNotificationStorage"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

type NotificationCandidate = {
  logicalKey: string
  householdId: string
  fixedExpensePeriodId?: string
  fixedExpenseId: string
  targetPeriod: string
  reminderType: FixedExpenseNotificationType
  triggerAt: Date
  body: string
  priority: number
}

export async function scheduleFixedExpensePeriodNotifications(
  userId: string,
  householdId: string,
  period: FixedExpensePeriod
) {
  return syncFixedExpenseNotifications({
    userId,
    householdId,
    periods: [period],
    fixedExpenses: [],
  })
}

export async function cancelFixedExpensePeriodNotifications(
  userId: string,
  householdId: string,
  periodId: string
) {
  const stored = await loadScheduledFixedExpenseNotifications(userId)
  const matching = stored.filter(
    (item) => item.householdId === householdId &&
      item.fixedExpensePeriodId === periodId
  )

  await Promise.all(
    matching.map((item) =>
      Notifications.cancelScheduledNotificationAsync(item.notificationId)
    )
  )

  if (__DEV__) {
    console.log("[Notifications] cancel", { householdId, periodId })
  }

  await saveScheduledFixedExpenseNotifications(
    userId,
    stored.filter((item) => !matching.includes(item))
  )
}

export async function rescheduleFixedExpensePeriodNotifications(
  userId: string,
  householdId: string,
  period: FixedExpensePeriod
) {
  await cancelFixedExpensePeriodNotifications(userId, householdId, period.id)
  return scheduleFixedExpensePeriodNotifications(userId, householdId, period)
}

export async function syncFixedExpenseNotifications({
  userId,
  householdId,
  periods,
  fixedExpenses,
}: {
  userId: string
  householdId: string
  periods: FixedExpensePeriod[]
  fixedExpenses: FixedExpense[]
}) {
  const permission = await getNotificationPermissionStatus()
  if (!permission.granted) {
    return
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "fixed-expense-reminders",
      {
        name: "Recordatorios de gastos",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      }
    )
  }

  const candidates = [
    ...periods.map((period) => buildPeriodCandidates(householdId, period)),
    ...buildNextMonthCandidates(householdId, fixedExpenses),
  ].flat()
  const desired = new Map(candidates.map((candidate) => [candidate.logicalKey, candidate]))
  const stored = await loadScheduledFixedExpenseNotifications(userId)
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const scheduledIds = new Set(scheduled.map((item) => item.identifier))
  const nextStored: ScheduledFixedExpenseNotification[] = []

  for (const item of stored) {
    if (item.householdId !== householdId) {
      nextStored.push(item)
      continue
    }

    const candidate = desired.get(item.logicalKey)
    if (
      candidate &&
      scheduledIds.has(item.notificationId) &&
      item.triggerAt === candidate.triggerAt.toISOString() &&
      item.body === candidate.body
    ) {
      nextStored.push(item)
      desired.delete(item.logicalKey)
    } else {
      await Notifications.cancelScheduledNotificationAsync(item.notificationId)
    }
  }

  for (const candidate of desired.values()) {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: getNotificationTitle(candidate.reminderType),
        body: candidate.body,
        data: {
          type: "fixed_expense",
          fixedExpensePeriodId: candidate.fixedExpensePeriodId,
          fixedExpenseId: candidate.fixedExpenseId,
          householdId: candidate.householdId,
          targetPeriod: candidate.targetPeriod,
        },
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: candidate.triggerAt,
        ...(Platform.OS === "android"
          ? { channelId: "fixed-expense-reminders" }
          : {}),
      },
    })

    nextStored.push({
      notificationId,
      logicalKey: candidate.logicalKey,
      householdId: candidate.householdId,
      fixedExpensePeriodId: candidate.fixedExpensePeriodId,
      fixedExpenseId: candidate.fixedExpenseId,
      targetPeriod: candidate.targetPeriod,
      reminderType: candidate.reminderType,
      triggerAt: candidate.triggerAt.toISOString(),
      body: candidate.body,
    })
    await saveScheduledFixedExpenseNotifications(userId, nextStored)

    if (__DEV__) {
      console.log("[Notifications] schedule", {
        householdId,
        reminderType: candidate.reminderType,
      })
    }
  }

  await saveScheduledFixedExpenseNotifications(userId, nextStored)

  if (__DEV__) {
    console.log("[Notifications] sync", {
      householdId,
      count: nextStored.filter((item) => item.householdId === householdId).length,
    })
  }
}

export async function scheduleTestNotification(seconds = 5) {
  if (!__DEV__) {
    return null
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Prueba de recordatorios",
      body: "Las notificaciones locales están activas.",
      data: { type: "fixed_expense", userId: "development" },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  })
}

if (__DEV__) {
  const debugGlobal = globalThis as typeof globalThis & {
    scheduleTestNotification?: typeof scheduleTestNotification
  }
  debugGlobal.scheduleTestNotification = scheduleTestNotification
}

function buildPeriodCandidates(
  householdId: string,
  period: FixedExpensePeriod
) {
  if (period.status === "paid" || period.remaining <= 0) {
    return []
  }

  return buildCandidates(
    householdId,
    period.id,
    period.fixedExpenseId,
    period.period,
    period.chargeDate,
    period.dueDate,
    period.name
  )
}

function buildNextMonthCandidates(
  householdId: string,
  fixedExpenses: FixedExpense[]
) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const nextMonthDate = new Date(year, month, 1)
  const nextYear = nextMonthDate.getFullYear()
  const nextMonth = nextMonthDate.getMonth() + 1
  const targetPeriod = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`

  return fixedExpenses
    .filter((expense) => expense.is_active)
    .flatMap((expense) => {
      const chargeDate = toDateString(
        resolveMonthlyDay(nextYear, nextMonth, expense.charge_day)
      )
      const dueDate = toDateString(
        resolveMonthlyDay(nextYear, nextMonth, expense.due_day)
      )

      return buildCandidates(
        householdId,
        undefined,
        expense.id,
        targetPeriod,
        chargeDate,
        dueDate,
        expense.name
      )
    })
}

function buildCandidates(
  householdId: string,
  fixedExpensePeriodId: string | undefined,
  fixedExpenseId: string,
  targetPeriod: string,
  chargeDate: string,
  dueDate: string,
  name: string
) {
  const events: Array<{
    reminderType: FixedExpenseNotificationType
    date: string
    title: string
    body: string
    priority: number
  }> = [
    {
      reminderType: "charge_in_5_days",
      date: shiftDate(chargeDate, -5),
      title: "Pago próximo",
      body: `En 5 días comienza el cobro de ${name}.`,
      priority: 7,
    },
    {
      reminderType: "charge_tomorrow",
      date: shiftDate(chargeDate, -1),
      title: "Pago mañana",
      body: `Mañana comienza el cobro de ${name}.`,
      priority: 6,
    },
    {
      reminderType: "charge_today",
      date: chargeDate,
      title: "Pago disponible",
      body: `Hoy comienza el cobro de ${name}.`,
      priority: 5,
    },
    {
      reminderType: "due_in_3_days",
      date: shiftDate(dueDate, -3),
      title: "Vencimiento próximo",
      body: `${name} vence en 3 días.`,
      priority: 4,
    },
    {
      reminderType: "due_tomorrow",
      date: shiftDate(dueDate, -1),
      title: "Vence mañana",
      body: `${name} vence mañana.`,
      priority: 3,
    },
    {
      reminderType: "due_today",
      date: dueDate,
      title: "Vence hoy",
      body: `${name} vence hoy.`,
      priority: 2,
    },
  ]
  const candidatesByDate = new Map<string, typeof events[number]>()

  for (const event of events) {
    const triggerAt = createLocalNotificationDate(event.date)
    if (triggerAt.getTime() <= Date.now()) {
      continue
    }

    const previous = candidatesByDate.get(triggerAt.toISOString())
    if (!previous || event.priority < previous.priority) {
      candidatesByDate.set(triggerAt.toISOString(), event)
    }
  }

  return [...candidatesByDate.values()].map((event) => {
    const triggerAt = createLocalNotificationDate(event.date)
    const logicalSuffix = fixedExpensePeriodId ?? targetPeriod
    return {
      logicalKey: `${logicalSuffix}:${event.reminderType}`,
      householdId,
      fixedExpensePeriodId,
      fixedExpenseId,
      targetPeriod,
      reminderType: event.reminderType,
      triggerAt,
      body: event.body,
      priority: event.priority,
    }
  })
}

function getNotificationTitle(type: FixedExpenseNotificationType) {
  switch (type) {
    case "charge_in_5_days": return "Pago próximo"
    case "charge_tomorrow": return "Pago mañana"
    case "charge_today": return "Pago disponible"
    case "due_in_3_days": return "Vencimiento próximo"
    case "due_tomorrow": return "Vence mañana"
    case "due_today": return "Vence hoy"
  }
}

export function createLocalNotificationDate(dateString: string, hour = 9) {
  const [year, month, day] = dateString.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day, hour, 0, 0, 0)
}

function shiftDate(dateString: string, days: number) {
  const date = createLocalNotificationDate(dateString, 12)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
