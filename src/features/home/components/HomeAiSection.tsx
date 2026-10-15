import { useState } from "react"
import { StyleSheet, View } from "react-native"

import { ListSection } from "../../../components/layout/ListSection"
import { SectionHeader } from "../../../components/layout/SectionHeader"
import { useDashboardInsights } from "../../dashboard/hooks/useDashboardInsights"
import type { HomeAiInsight } from "../../dashboard/types/homeAiInsight"
import { HomeInsightCard } from "./HomeInsightCard"
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
    : (insightsQuery.data ?? []).filter((insight) => isActionableInsightCopy(insight.message))
  const narrative = insightQuery.isError ? undefined : insightQuery.data
  const hasNarrative = hasInsightCopy(narrative)

  if (!hasNarrative && cards.length === 0) return null

  const expandedLabel = expanded ? "Cerrar" : "Ver más"

  return (
    <ListSection>
      <View style={styles.section}>
        <SectionHeader
          actionAccessibilityLabel={expanded ? "Cerrar insights" : "Ver insights"}
          actionLabel={expandedLabel}
          icon={<InsightSectionIcon />}
          onAction={() => setExpanded((current) => !current)}
          title="Para tener en cuenta"
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
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </ListSection>
  )
}

const EMPTY_INSIGHT_COPY = "Tus finanzas no muestran alertas importantes por ahora."

function hasInsightCopy(insight: HomeAiInsight | undefined) {
  if (!insight) return false
  if (isActionableInsightCopy(insight.intro)) return true
  return insight.groups.some((group) => isActionableInsightCopy(group.text))
}

function isActionableInsightCopy(text: string) {
  const normalized = text.trim().replace(/\s+/g, " ").replace(/[.。]$/, "")
  const empty = EMPTY_INSIGHT_COPY.replace(/[.。]$/, "")
  return normalized.length > 0 && normalized !== empty
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  body: {
    gap: 12,
  },
})
