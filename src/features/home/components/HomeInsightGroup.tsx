import { StyleSheet } from "react-native"

import { AppText } from "../../../components/text/AppText"
import type {
  HomeAiInsightAction,
  HomeAiInsightGroup as HomeAiInsightGroupData,
} from "../../dashboard/types/homeAiInsight"

type HomeInsightGroupProps = {
  group: HomeAiInsightGroupData
  actions: HomeAiInsightAction[]
  onActionPress: (action: HomeAiInsightAction) => void
  variant?: "card" | "plain"
}

export function HomeInsightGroup({
  group,
  actions,
  onActionPress,
  variant = "card",
}: HomeInsightGroupProps) {
  const actionsById = new Map(actions.map((action) => [action.id, action]))
  const groupActions = group.actionIds
    .map((id) => actionsById.get(id))
    .filter((action): action is HomeAiInsightAction => Boolean(action))

  if (groupActions.length !== group.actionIds.length) {
    return (
      <AppText tone={variant === "plain" ? "muted" : "default"} variant={variant === "plain" ? "title" : "body"}>
        {group.text}
      </AppText>
    )
  }

  return (
    <AppText tone={variant === "plain" ? "muted" : "default"} variant={variant === "plain" ? "title" : "body"}>
      {segmentInsightGroup(group.text, groupActions).map((segment, index) =>
        segment.type === "action" ? (
          <AppText
            accessibilityLabel={`Abrir detalle: ${segment.action.label}`}
            accessibilityRole="button"
            key={`${segment.action.id}-${segment.start}`}
            onPress={() => onActionPress(segment.action)}
            style={styles.action}
            tone="brand"
            variant={variant === "plain" ? "title" : "body"}
          >
            {segment.value}
          </AppText>
        ) : (
          <AppText key={`text-${group.id}-${index}`} variant={variant === "plain" ? "title" : "body"}>
            {segment.value}
          </AppText>
        )
      )}
    </AppText>
  )
}

type GroupSegment =
  | { type: "text"; value: string }
  | { type: "action"; value: string; action: HomeAiInsightAction; start: number }

export function segmentInsightGroup(text: string, actions: HomeAiInsightAction[]): GroupSegment[] {
  const matches = actions.flatMap((action, actionIndex) => {
    const found: Array<{ action: HomeAiInsightAction; actionIndex: number; start: number; end: number }> = []
    let searchFrom = 0
    while (action.text.length > 0) {
      const start = text.indexOf(action.text, searchFrom)
      if (start < 0) break
      found.push({ action, actionIndex, start, end: start + action.text.length })
      searchFrom = start + action.text.length
    }
    return found
  }).sort((left, right) => left.start - right.start || right.end - left.end || left.actionIndex - right.actionIndex)

  const segments: GroupSegment[] = []
  let cursor = 0
  for (const match of matches) {
    if (match.start < cursor) continue
    if (match.start > cursor) segments.push({ type: "text", value: text.slice(cursor, match.start) })
    segments.push({ type: "action", value: text.slice(match.start, match.end), action: match.action, start: match.start })
    cursor = match.end
  }
  if (cursor < text.length) segments.push({ type: "text", value: text.slice(cursor) })
  return segments.length > 0 ? segments : [{ type: "text", value: text }]
}

const styles = StyleSheet.create({
  action: { textDecorationLine: "underline" },
})
