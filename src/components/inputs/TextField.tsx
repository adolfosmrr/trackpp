import {
  Pressable,
  StyleSheet,
  TextInput,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native"

import { colors, fonts, radii } from "../../theme"

type TextFieldProps = TextInputProps & {
  style?: StyleProp<TextStyle>
}

type FieldRowProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>
}

export function TextField({
  multiline,
  placeholderTextColor,
  style,
  ...props
}: TextFieldProps) {
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={placeholderTextColor ?? colors.mutedForeground}
      style={[
        fieldStyles.surface,
        fieldStyles.text,
        style,
        multiline ? fieldStyles.multiline : null,
        multiline ? fieldStyles.multilineRadius : fieldStyles.pill,
      ]}
    />
  )
}

export function FieldRow({ style, ...props }: FieldRowProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole={props.accessibilityRole ?? "button"}
      style={[fieldStyles.surface, fieldStyles.row, style, fieldStyles.pill]}
    />
  )
}

export const fieldStyles = StyleSheet.create({
  surface: {
    backgroundColor: colors.field,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: "100%",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text: {
    color: colors.foreground,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 16,
  },
  pill: {
    borderRadius: radii.pill,
  },
  multiline: {
    lineHeight: 22,
    textAlignVertical: "top",
  },
  multilineRadius: {
    borderRadius: radii.lg,
  },
})
