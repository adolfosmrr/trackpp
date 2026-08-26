import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useHouseholdStore } from "../../../store/householdStore"
import { supabase } from "../../../services/supabase"
import { useAuth } from "../../auth/context/AuthContext"

import type { HouseholdActivityType } from "../types"

export function useActivityRealtime(enabled = true) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  useEffect(() => {
    if (!enabled || !selectedHouseholdId) {
      return
    }

    const channel = supabase
      .channel(`household-activity:${selectedHouseholdId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "household_activity",
          filter: `household_id=eq.${selectedHouseholdId}`,
        },
        (payload) => {
          const activityType = getActivityType(
            payload.new
          )

          if (__DEV__) {
            console.log("[Activity Realtime] event received", {
              householdId: selectedHouseholdId,
              eventType: payload.eventType,
              activityType,
            })
          }

          invalidate(queryClient, "activity", selectedHouseholdId)

          const actorId = getActorId(payload.new)
          if (
            actorId !== user?.id &&
            user?.id
          ) {
            invalidateUnread(
              queryClient,
              selectedHouseholdId,
              user.id
            )
          }

          switch (activityType) {
            case "transaction_created":
            case "transaction_deleted":
              invalidate(queryClient, "transactions", selectedHouseholdId)
              invalidate(queryClient, "dashboard", selectedHouseholdId)
              invalidate(queryClient, "dashboard-insights", selectedHouseholdId)
              invalidate(queryClient, "budgets", selectedHouseholdId)
              logInvalidations(
                [
                  "transactions",
                  "dashboard",
                  "dashboard-insights",
                  "budgets",
                ],
                selectedHouseholdId
              )
              break
            case "budget_created":
            case "budget_updated":
            case "budget_deleted":
              invalidate(queryClient, "budgets", selectedHouseholdId)
              invalidate(
                queryClient,
                "dashboard-insights",
                selectedHouseholdId
              )
              logInvalidations(
                ["budgets", "dashboard-insights"],
                selectedHouseholdId
              )
              break
            case "fixed_expense_created":
            case "fixed_expense_updated":
            case "fixed_expense_deleted":
              invalidate(queryClient, "fixed-expenses", selectedHouseholdId)
              invalidate(queryClient, "fixed-expense-reminders", selectedHouseholdId)
              logInvalidations(["fixed-expenses", "fixed-expense-reminders"], selectedHouseholdId)
              break
            case "fixed_expense_payment_created":
            case "fixed_expense_payment_updated":
              invalidate(queryClient, "fixed-expense-periods", selectedHouseholdId)
              invalidate(queryClient, "fixed-expenses", selectedHouseholdId)
              invalidate(queryClient, "fixed-expense-reminders", selectedHouseholdId)
              invalidate(queryClient, "transactions", selectedHouseholdId)
              invalidate(queryClient, "dashboard", selectedHouseholdId)
              invalidate(queryClient, "budgets", selectedHouseholdId)
              invalidate(queryClient, "dashboard-insights", selectedHouseholdId)
              logInvalidations(
                [
                  "fixed-expense-periods",
                  "fixed-expenses",
                  "fixed-expense-reminders",
                  "transactions",
                  "dashboard",
                  "budgets",
                  "dashboard-insights",
                ],
                selectedHouseholdId
              )
              break
            case "member_joined":
              if (user?.id) {
                invalidate(queryClient, "households", user.id)
              }
              logInvalidations(
                user?.id ? ["households"] : [],
                selectedHouseholdId
              )
              break
            case null:
              break
          }
        }
      )
      .subscribe((status) => {
        if (!__DEV__) {
          return
        }

        if (status === "SUBSCRIBED") {
          console.log("[Activity Realtime] subscribed", {
            householdId: selectedHouseholdId,
          })
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.log("[Activity Realtime] " + status, {
            householdId: selectedHouseholdId,
          })
        }
      })

    return () => {
      if (__DEV__) {
        console.log("[Activity Realtime] unsubscribed", {
          householdId: selectedHouseholdId,
        })
      }

      void supabase.removeChannel(channel)
    }
  }, [
    enabled,
    queryClient,
    selectedHouseholdId,
    user?.id,
  ])
}

function invalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  key: string,
  householdId: string
) {
  void queryClient.invalidateQueries({
    queryKey: [key, householdId],
  })
}

function logInvalidations(
  keys: string[],
  householdId: string
) {
  if (__DEV__ && keys.length) {
    console.log("[Activity Realtime] invalidating", {
      householdId,
      queries: keys,
    })
  }
}

function getActivityType(
  value: unknown
): HouseholdActivityType | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    typeof value.type !== "string"
  ) {
    return null
  }

  switch (value.type) {
    case "transaction_created":
    case "budget_created":
    case "budget_updated":
    case "transaction_deleted":
    case "budget_deleted":
    case "member_joined":
    case "fixed_expense_created":
    case "fixed_expense_updated":
    case "fixed_expense_deleted":
    case "fixed_expense_payment_created":
    case "fixed_expense_payment_updated":
      return value.type
    default:
      return null
  }
}

function getActorId(value: unknown): string | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("actor_id" in value) ||
    typeof value.actor_id !== "string"
  ) {
    return null
  }

  return value.actor_id
}

function invalidateUnread(
  queryClient: ReturnType<typeof useQueryClient>,
  householdId: string,
  userId: string
) {
  void queryClient.invalidateQueries({
    queryKey: [
      "activity-unread",
      householdId,
      userId,
    ],
  })
}
