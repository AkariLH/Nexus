import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from "react-native";

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  colors?: readonly [string, string, ...string[]];
  style?: any;
}

export function GradientButton({
  onPress,
  title,
  disabled = false,
  loading = false,
  colors = ["#FF4F81", "#8A2BE2"],
  style,
}: GradientButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={disabled || loading}
      style={[styles.buttonWrapper, disabled && { opacity: 0.5 }, style]}
      onPress={onPress}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  button: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
