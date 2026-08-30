import Svg, { Path } from "react-native-svg"

type FilterChevronIconProps = {
  color?: string
}

export function FilterChevronIcon({ color = "#1C1C1C" }: FilterChevronIconProps) {
  return (
    <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
      <Path
        d="M0.205025 1.19524C-0.068342 0.921876 -0.068342 0.478375 0.205025 0.205008C0.478392 -0.0683584 0.921892 -0.0683585 1.19526 0.205008L6.69038 5.70013L1.19526 11.1952C0.921893 11.4686 0.478392 11.4686 0.205025 11.1952C-0.0683418 10.9219 -0.0683418 10.4784 0.205025 10.205L4.70991 5.70013L0.205025 1.19524Z"
        fill={color}
      />
    </Svg>
  )
}
