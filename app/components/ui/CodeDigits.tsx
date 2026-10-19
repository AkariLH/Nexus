import { useRef, useState } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";
import { palette } from "../../../constants/colors";

interface CodeDigitsProps {
  /** Un elemento por casilla ("" si esta vacia). */
  value: string[];
  onChange: (value: string[]) => void;
  editable?: boolean;
}

/**
 * "Dígito de código" de Figma (`115:2632`): casillas de un digito. Al escribir pasa a la
 * siguiente, al borrar en una vacia regresa, y pegar el codigo completo llena todas.
 */
export function CodeDigits({ value, onChange, editable = true }: CodeDigitsProps) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const [focused, setFocused] = useState<number | null>(null);

  const change = (index: number, text: string) => {
    const digits = text.replace(/\D/g, "");
    const next = [...value];
    if (digits.length > 1) {
      // Pegado: reparte desde esta casilla.
      digits.split("").slice(0, value.length - index).forEach((d, i) => (next[index + i] = d));
      onChange(next);
      inputs.current[Math.min(index + digits.length, value.length - 1)]?.focus();
      return;
    }
    next[index] = digits;
    onChange(next);
    if (digits && index < value.length - 1) inputs.current[index + 1]?.focus();
  };

  const keyPress = (index: number, key: string) => {
    if (key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {value.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          value={digit}
          onChangeText={(text) => change(index, text)}
          onKeyPress={({ nativeEvent }) => keyPress(index, nativeEvent.key)}
          onFocus={() => setFocused(index)}
          onBlur={() => setFocused(null)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          editable={editable}
          accessibilityLabel={`Dígito ${index + 1} de ${value.length}`}
          style={[styles.digit, focused === index && styles.focused]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  digit: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: palette.text,
    ...(Platform.OS === "web" ? { outlineWidth: 0 } : {}),
  },
  focused: {
    borderWidth: 2,
    borderColor: palette.secondary,
  },
});
