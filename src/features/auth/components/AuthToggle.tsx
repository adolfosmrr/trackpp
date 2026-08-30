import { SegmentedToggle } from "../../../components/inputs/SegmentedToggle"

export type AuthMode = "login" | "register"

type AuthToggleProps = {
  value: AuthMode
  onChange: (value: AuthMode) => void
}

export function AuthToggle({ value, onChange }: AuthToggleProps) {
  return (
    <SegmentedToggle
      value={value}
      options={[
        { value: "login", label: "Iniciar sesión" },
        { value: "register", label: "Registrarse" },
      ]}
      onChange={onChange}
      width={300}
    />
  )
}
