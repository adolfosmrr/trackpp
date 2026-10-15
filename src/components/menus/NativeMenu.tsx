import type { ComponentType } from "react"
import { Platform } from "react-native"

import type { NativeMenuProps } from "./nativeMenu"

type NativeMenuComponent = ComponentType<NativeMenuProps>

function readMenu(module: { NativeMenu: NativeMenuComponent }) {
  return module.NativeMenu
}

const Menu = readMenu(
  Platform.OS === "ios"
    ? require("./IosNativeMenu")
    : Platform.OS === "android"
      ? require("./AndroidNativeMenu")
      : require("./WebNativeMenu"),
)

export function NativeMenu(props: NativeMenuProps) {
  return <Menu {...props} />
}
