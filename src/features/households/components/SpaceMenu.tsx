import { NativeMenu } from "../../../components/menus/NativeMenu"
import {
  CREATE_SPACE_LABEL,
  SPACE_MENU_LABEL,
  type SpaceMenuProps,
} from "./spaceMenu"

export function SpaceMenu({ compact, label, items, onSelect, onCreate }: SpaceMenuProps) {
  return (
    <NativeMenu
      accessibilityLabel={SPACE_MENU_LABEL}
      compact={compact}
      entries={[
        ...items.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.subtitle,
          selected: item.selected,
        })),
        {
          id: "create",
          separatorBefore: items.length > 0,
          title: CREATE_SPACE_LABEL,
        },
      ]}
      label={label}
      onSelect={(id) => {
        if (id === "create") onCreate()
        else onSelect(id)
      }}
      variant="space"
    />
  )
}
