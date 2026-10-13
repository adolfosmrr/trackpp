import Svg, { Path } from "react-native-svg"

import { colors } from "../../theme"

type CloseIconProps = {
  color?: string
}

export function CloseIcon({ color = colors.foreground }: CloseIconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M1 1L13 13M13 1L1 13"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.6}
      />
    </Svg>
  )
}
