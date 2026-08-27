import { Fragment, useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"

import type {
  HomeAiInsight,
  HomeAiInsightAction,
} from "../../dashboard/types/homeAiInsight"
import {
  InsightActionPopover,
  type InsightActionDetail,
} from "./InsightActionPopover"
import { HomeInsightGroup } from "./HomeInsightGroup"

export type HomeInsightCardProps = {
  insight: HomeAiInsight
  actionDetails?: Record<string, InsightActionDetail | undefined>
  isCollapsed?: boolean
  variant?: "card" | "plain"
}

export function HomeInsightCard({
  insight,
  actionDetails,
  isCollapsed = false,
  variant = "card",
}: HomeInsightCardProps) {
  const [selectedAction, setSelectedAction] = useState<HomeAiInsightAction | null>(null)

  useEffect(() => {
    if (isCollapsed) setSelectedAction(null)
  }, [isCollapsed])

  return (
    <View style={[styles.card, variant === "plain" && styles.plainCard]}>
      <Text
        style={[styles.messageText, variant === "plain" && styles.plainMessage]}
      >
        {insight.intro.trim()}
        {insight.groups.map((group, index) => (
          <Fragment key={group.id}>
            <Text>{getGroupSeparator(insight.groups.length, index)}</Text>
            <HomeInsightGroup
              actions={insight.actions}
              group={group}
              onActionPress={(action) => setSelectedAction((current) => current?.id === action.id ? null : action)}
              variant={variant}
            />
          </Fragment>
        ))}
      </Text>

      {selectedAction ? (
        <InsightActionPopover
          action={selectedAction}
          detail={actionDetails?.[selectedAction.id]}
          onClose={() => setSelectedAction(null)}
        />
      ) : null}
    </View>
  )
}

function getGroupSeparator(groupCount: number, groupIndex: number) {
  if (groupIndex === 0) return " "
  if (groupCount === 2 && groupIndex === 1) return ", y "
  if (groupIndex === groupCount - 1) return " y "
  return ", "
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 16,
  },
  plainCard: {
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    position: "relative",
  },
  messageText: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 14,
    lineHeight: 18,
  },
  plainMessage: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 22,
    lineHeight: 28,
    opacity: 0.5,
  },
})
