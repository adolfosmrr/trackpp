import { useState } from "react"
import { StyleSheet, View } from "react-native"

import { useDashboardInsights } from "../../dashboard/hooks/useDashboardInsights"
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
  const cards = insightsQuery.isError ? [] : insightsQuery.data ?? []
  const narrative = insightQuery.isError ? undefined : insightQuery.data
  const hasNarrative = Boolean(narrative?.intro || narrative?.groups.length)
  const hasContent = hasNarrative || cards.length > 0

  if (!hasContent) return null

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

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  body: {
    gap: 12,
  },
})
