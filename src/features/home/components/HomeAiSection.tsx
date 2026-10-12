import { useState } from "react"
import { StyleSheet, View } from "react-native"

import { useDashboardInsights } from "../../dashboard/hooks/useDashboardInsights"
import type { HomeAiInsight } from "../../dashboard/types/homeAiInsight"
import { HomeInsightCard } from "./HomeInsightCard"
import { HomeSectionTitle } from "./HomeSectionTitle"
import { HomeSectionToggle } from "./HomeSectionToggle"
import { InsightSectionIcon } from "./icons/InsightSectionIcon"
import { StackedCardList } from "./StackedCardList"
import { HomeInfoCard, type HomeInfoCardVariant } from "./HomeInfoCard"
import { useHomeAiInsight } from "../hooks/useHomeAiInsight"
import { useHomeInsightActionDetails } from "../hooks/useHomeInsightActionDetails"

const INFO_CARD_VARIANTS: HomeInfoCardVariant[] = [
  "darkGradientText",
  "light",
  "gradient",
]

export function HomeAiSection() {
  const [expanded, setExpanded] = useState(false)
  const insightQuery = useHomeAiInsight()
  const insightsQuery = useDashboardInsights()
  const actionDetailsQuery = useHomeInsightActionDetails(
    insightQuery.isError ? undefined : insightQuery.data,
  )
  const cards = insightsQuery.isError
    ? []
    : (insightsQuery.data ?? []).filter((insight) => insight.message.trim().length > 0)
  const narrative = insightQuery.isError ? undefined : insightQuery.data
  const hasNarrative = hasInsightCopy(narrative)

  if (!hasNarrative && cards.length === 0) return null

  return (
    <View style={styles.section}>
      <HomeSectionTitle
        icon={<InsightSectionIcon />}
        title="Para tener en cuenta"
        rightElement={
          <HomeSectionToggle
            expanded={expanded}
            onPress={() => setExpanded((current) => !current)}
          />
        }
      />
      {expanded ? (
        <View style={styles.body}>
          {cards.length ? (
            <StackedCardList
              items={cards}
              expanded
              renderItem={(insight, index) => (
                <HomeInfoCard
                  icon={insight.categoryIcon}
                  message={insight.message}
                  variant={INFO_CARD_VARIANTS[index % INFO_CARD_VARIANTS.length]}
                />
              )}
            />
          ) : null}
          {hasNarrative && narrative ? (
            <HomeInsightCard
              actionDetails={actionDetailsQuery.actionDetails}
              insight={narrative}
              variant="card"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

function hasInsightCopy(insight: HomeAiInsight | undefined) {
  if (!insight) return false
  if (insight.intro.trim().length > 0) return true
  return insight.groups.some((group) => group.text.trim().length > 0)
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  body: {
    gap: 12,
  },
})
