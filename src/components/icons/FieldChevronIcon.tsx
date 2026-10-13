import Svg, { Path } from "react-native-svg"

import { colors } from "../../theme"

type FieldChevronIconProps = {
  color?: string
}

export function FieldChevronIcon({ color = colors.mutedForeground }: FieldChevronIconProps) {
  return (
    <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
      <Path
        d="M0.699951 10.7L5.69995 5.69995L0.699951 0.699951"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  )
}
