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
            color="#1A1A1A66"
            style={styles.iconLeft}
          />
        )}
        <TextInput
          {...textInputProps}
          placeholderTextColor="#1A1A1A66"
          style={[styles.input, textInputProps.style]}
          secureTextEntry={isPassword && !showPassword}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#1A1A1A66"
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
    color: "#1A1A1A",
    marginBottom: 8,
    fontSize: 14,
  },
  inputWrapper: {
    position: "relative",
    backgroundColor: "#F7F7F7",
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
    color: "#1A1A1A",
  },
  error: {
    color: "#FF4F81",
    fontSize: 12,
    marginTop: 4,
  },
});
