import { Fragment, useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"

import { AppText } from "../../../components/text/AppText"

import type {
  HomeAiInsight,
  HomeAiInsightAction,
} from "../../dashboard/types/homeAiInsight"
import {
  InsightActionPopover,
  type InsightActionDetail,
} from "./InsightActionPopover"
import { colors, radii } from "../../../theme"
import { HomeInsightGroup } from "./HomeInsightGroup"

type HomeInsightCardProps = {
  insight: HomeAiInsight
  actionDetails?: Record<string, InsightActionDetail | undefined>
  isCollapsed?: boolean
}

export function HomeInsightCard({
  insight,
  actionDetails,
  isCollapsed = false,
}: HomeInsightCardProps) {
  const [selectedAction, setSelectedAction] = useState<HomeAiInsightAction | null>(null)

  useEffect(() => {
    if (isCollapsed) setSelectedAction(null)
  }, [isCollapsed])

  return (
    <View style={styles.card}>
      <AppText variant="body">
        {insight.intro.trim()}
        {insight.groups.map((group, index) => (
          <Fragment key={group.id}>
            <AppText variant="body">
              {getGroupSeparator(insight.groups.length, index)}
            </AppText>
            <HomeInsightGroup
              actions={insight.actions}
              group={group}
              onActionPress={(action) => setSelectedAction((current) => current?.id === action.id ? null : action)}
            />
          </Fragment>
        ))}
      </AppText>

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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
  },
})
