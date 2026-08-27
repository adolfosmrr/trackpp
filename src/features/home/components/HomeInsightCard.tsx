import { useState } from "react"
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native"

import type {
  HomeAiInsight,
  HomeAiInsightAction,
} from "../../dashboard/types/homeAiInsight"
import {
  InsightActionPopover,
  type InsightActionDetail,
} from "./InsightActionPopover"

export type HomeInsightCardProps = {
  insight: HomeAiInsight
  actionDetails?: Record<string, InsightActionDetail | undefined>
  variant?: "card" | "plain"
}

type MessageSegment =
  | { type: "text"; value: string }
  | { type: "action"; value: string; action: HomeAiInsightAction }

export function HomeInsightCard({
  insight,
  actionDetails,
  variant = "card",
}: HomeInsightCardProps) {
  const [selectedAction, setSelectedAction] = useState<HomeAiInsightAction | null>(null)
  const [messageHeight, setMessageHeight] = useState(0)

  const segments = segmentInsightMessage(insight.message, insight.actions)

  return (
    <View style={[styles.card, variant === "plain" && styles.plainCard]}>
      <Text
        numberOfLines={4}
        onLayout={(event: LayoutChangeEvent) => {
          setMessageHeight(event.nativeEvent.layout.height)
        }}
        style={[styles.message, variant === "plain" && styles.plainMessage]}
      >
        {segments.map((segment, index) => segment.type === "action" ? (
          <Text
            accessibilityLabel={`Abrir detalle: ${segment.action.label}`}
            accessibilityRole="button"
            key={`${segment.action.id}-${index}`}
            onPress={() => setSelectedAction((current) =>
              current?.id === segment.action.id ? null : segment.action
            )}
            style={[styles.action, variant === "plain" && styles.plainAction]}
          >
            {segment.value}
          </Text>
        ) : (
          <Text key={`text-${index}`}>{segment.value}</Text>
        ))}
      </Text>

      {selectedAction ? (
        <InsightActionPopover
          action={selectedAction}
          detail={actionDetails?.[selectedAction.id]}
          onClose={() => setSelectedAction(null)}
          style={variant === "plain" ? [styles.floatingPopover, { top: messageHeight + 12 }] : undefined}
        />
      ) : null}
    </View>
  )
}

export function segmentInsightMessage(
  message: string,
  actions: HomeAiInsightAction[]
): MessageSegment[] {
  const matches = actions.flatMap((action, actionIndex) => {
    const found: Array<{
      action: HomeAiInsightAction
      actionIndex: number
      start: number
      end: number
    }> = []
    let start = 0

    while (action.text.length > 0) {
      const matchStart = message.indexOf(action.text, start)
      if (matchStart < 0) break
      found.push({
        action,
        actionIndex,
        start: matchStart,
        end: matchStart + action.text.length,
      })
      start = matchStart + action.text.length
    }

    return found
  }).sort((left, right) =>
    left.start - right.start ||
    right.end - left.end ||
    left.actionIndex - right.actionIndex
  )

  const segments: MessageSegment[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.start < cursor) continue
    if (match.start > cursor) {
      segments.push({ type: "text", value: message.slice(cursor, match.start) })
    }
    segments.push({
      type: "action",
      value: message.slice(match.start, match.end),
      action: match.action,
    })
    cursor = match.end
  }

  if (cursor < message.length) {
    segments.push({ type: "text", value: message.slice(cursor) })
  }

  return segments.length > 0 ? segments : [{ type: "text", value: message }]
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
  message: {
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
  action: {
    color: "#1C1C1C",
    fontFamily: "FamiljenGrotesk-Medium",
    fontSize: 14,
    lineHeight: 18,
    textDecorationLine: "underline",
  },
  plainAction: {
    color: "#FFFFFF",
    fontFamily: "FamiljenGrotesk-Bold",
    fontSize: 22,
    lineHeight: 28,
    opacity: 0.5,
  },
  floatingPopover: {
    left: 0,
    marginTop: 0,
    position: "absolute",
    right: 0,
  },
})
