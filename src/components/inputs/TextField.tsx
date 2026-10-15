import { forwardRef, type ComponentProps, type ForwardedRef, type ReactNode } from "react"
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextInput as NativeTextInput,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native"
import { TextInput } from "react-native-gesture-handler"

import { colors, fonts, radii } from "../../theme"

type TextFieldProps = TextInputProps & {
  style?: StyleProp<TextStyle>
  trailing?: ReactNode
}

type FieldRowProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>
}

export const TextField = forwardRef<NativeTextInput, TextFieldProps>(
  function TextField({
    multiline,
    placeholderTextColor,
    style,
    trailing,
    ...props
  }, ref) {
    const input = (
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={placeholderTextColor ?? colors.mutedForeground}
        ref={gestureTextInputRef(ref)}
        style={[
          fieldStyles.surface,
          fieldStyles.text,
          trailing ? fieldStyles.trailingInput : null,
          style,
          multiline ? fieldStyles.multiline : null,
          multiline ? fieldStyles.multilineRadius : fieldStyles.pill,
        ]}
      />
    )

    if (!trailing) return input

    return (
      <View style={fieldStyles.trailingHost}>
        {input}
        <View pointerEvents="none" style={fieldStyles.trailing}>
          {trailing}
        </View>
      </View>
    )
  },
)

function gestureTextInputRef(ref: ForwardedRef<NativeTextInput>) {
  return ref as unknown as NonNullable<ComponentProps<typeof TextInput>["ref"]>
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
  trailingHost: {
    justifyContent: "center",
    width: "100%",
  },
  trailingInput: {
    paddingRight: 48,
  },
  trailing: {
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    top: 0,
  },
})
