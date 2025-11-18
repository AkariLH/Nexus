import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Header } from "../components/layout/Header";
import { Input } from "../components/ui/Input";
import { GradientButton } from "../components/ui/GradientButton";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isValid = password && confirmPassword && password === confirmPassword;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#FF4F81" />
        </View>

        <Text style={styles.title}>Nueva contraseña</Text>
        <Text style={styles.subtitle}>
          Crea una contraseña segura para tu cuenta
        </Text>

        {/* Nueva contraseña */}
        <View style={styles.field}>
          <Text style={styles.label}>Nueva contraseña</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#1A1A1A66"
              style={styles.iconLeft}
            />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#1A1A1A66"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
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
          </View>
        </View>

        {/* Confirmar contraseña */}
        <View style={styles.field}>
          <Text style={styles.label}>Confirmar contraseña</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#1A1A1A66"
              style={styles.iconLeft}
            />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#1A1A1A66"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.iconRight}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#1A1A1A66"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón de cambio */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!isValid}
          style={[styles.buttonWrapper, !isValid && { opacity: 0.5 }]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <LinearGradient
            colors={["#FF4F81", "#8A2BE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Cambiar contraseña</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backButton: { padding: 6, borderRadius: 20 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,79,129,0.1)",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#1A1A1A99",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  field: {
    marginBottom: 24,
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
  iconLeft: { position: "absolute", left: 16 },
  iconRight: { position: "absolute", right: 16 },
  input: {
    height: "100%",
    paddingLeft: 44,
    paddingRight: 44,
    fontSize: 16,
    color: "#1A1A1A",
  },
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
