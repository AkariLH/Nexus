import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { palette } from "../../../constants/colors";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
}

export function Input({
  label,
  icon,
  error,
  isPassword,
  ...textInputProps
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={palette.icon}
            style={styles.iconLeft}
          />
        )}
        <TextInput
          accessibilityLabel={label}
          {...textInputProps}
          placeholderTextColor={palette.textMuted}
          style={[styles.input, textInputProps.style]}
          secureTextEntry={isPassword && !showPassword}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={palette.icon}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 20,
  },
  label: {
    color: palette.text,
    marginBottom: 8,
    fontSize: 14,
  },
  inputWrapper: {
    position: "relative",
    backgroundColor: palette.surfaceMuted,
    borderRadius: 20,
    height: 56,
    justifyContent: "center",
  },
  iconLeft: {
    position: "absolute",
    left: 16,
  },
  iconRight: {
    position: "absolute",
    right: 16,
  },
  input: {
    height: "100%",
    paddingLeft: 44,
    paddingRight: 44,
    fontSize: 16,
    color: palette.text,
  },
  error: {
    color: palette.textAccent,
    fontSize: 12,
    marginTop: 4,
  },
});
