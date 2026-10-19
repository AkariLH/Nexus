import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useState } from "react";
import {
  Platform,
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
  /** Texto de error; pinta el campo en rojo y sustituye a la ayuda. */
  error?: string;
  /** Ayuda fija bajo el campo (p. ej. las reglas de la contrasena, Figma H2). */
  help?: string;
  isPassword?: boolean;
}

/**
 * "Campo de texto" de Figma (Componentes de entrada `115:2625`): etiqueta, campo con estados
 * Normal / Enfocado / Error, ayuda debajo y ojo para las contrasenas.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, icon, error, help, isPassword, onFocus, onBlur, ...textInputProps },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, focused && styles.focused, !!error && styles.errored]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={palette.icon}
            style={styles.iconLeft}
          />
        )}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error || help}
          {...textInputProps}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={palette.textMuted}
          style={[styles.input, icon && styles.inputWithIcon, isPassword && styles.inputWithEye, textInputProps.style]}
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
              size={22}
              color={palette.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
      ) : help ? (
        <Text style={styles.help}>{help}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    marginBottom: 20,
  },
  label: {
    color: palette.text,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  inputWrapper: {
    position: "relative",
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    height: 54,
    justifyContent: "center",
  },
  focused: {
    borderWidth: 2,
    borderColor: palette.secondary,
  },
  errored: {
    borderWidth: 2,
    borderColor: palette.error,
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
    paddingHorizontal: 16,
    fontSize: 16,
    color: palette.text,
    // En web el navegador pinta su propio contorno encima del borde de enfoque.
    ...(Platform.OS === "web" ? { outlineWidth: 0 } : {}),
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  inputWithEye: {
    paddingRight: 52,
  },
  help: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  error: {
    color: palette.error,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
});
