import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useAuth } from "../../auth/context/AuthContext"
import { useHouseholdStore } from "../../../store/householdStore"

import {
  getUnreadActivityCount,
  markHouseholdActivitySeen,
} from "../services/activityReadService"

export function useUnreadActivity(
  enabled = true
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const selectedHouseholdId = useHouseholdStore(
    (state) => state.selectedHouseholdId
  )

  const isEnabled = Boolean(
    enabled && selectedHouseholdId && user?.id
  )

  const unreadQuery = useQuery({
    queryKey: [
      "activity-unread",
      selectedHouseholdId,
      user?.id,
    ],
    queryFn: () =>
      getUnreadActivityCount(selectedHouseholdId!),
    enabled: isEnabled,
  })

  const markSeenMutation = useMutation({
    mutationFn: () =>
      markHouseholdActivitySeen(selectedHouseholdId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          "activity-unread",
          selectedHouseholdId,
          user?.id,
        ],
      })
    },
  })

  return {
    unreadCount: isEnabled
      ? unreadQuery.data ?? 0
      : 0,
    markAsSeen: markSeenMutation.mutateAsync,
    isMarkingSeen: markSeenMutation.isPending,
  }
}
