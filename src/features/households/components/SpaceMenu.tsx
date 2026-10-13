import type { ComponentType } from "react"
import { Platform } from "react-native"

import type { SpaceMenuProps } from "./spaceMenu"

type SpaceMenuComponent = ComponentType<SpaceMenuProps>

function readSpaceMenu(module: { SpaceMenu: SpaceMenuComponent }) {
  return module.SpaceMenu
}

const Menu = readSpaceMenu(
  Platform.OS === "ios"
    ? require("./IosSpaceMenu")
    : Platform.OS === "android"
      ? require("./AndroidSpaceMenu")
      : require("./WebSpaceMenu"),
)

export function SpaceMenu(props: SpaceMenuProps) {
  return <Menu {...props} />
}
