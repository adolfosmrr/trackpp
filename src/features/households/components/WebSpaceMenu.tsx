import { SpaceMenuTrigger } from "./SpaceMenuTrigger"
import { CREATE_SPACE_LABEL, type SpaceMenuProps } from "./spaceMenu"

/** Web has no UIMenu. Assistive tech can still pick a space or create one. */
export function SpaceMenu({ compact, label, items, onSelect, onCreate }: SpaceMenuProps) {
  return (
    <SpaceMenuTrigger
      accessibilityActions={[
        ...items.map((item) => ({
          name: item.id,
          label: `${item.name}, ${item.subtitle}`,
        })),
        { name: "create", label: CREATE_SPACE_LABEL },
      ]}
      compact={compact}
      label={label}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "create") {
          onCreate()
          return
        }
        onSelect(event.nativeEvent.actionName)
      }}
    />
  )
}
