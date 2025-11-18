import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Header } from "../components/layout/Header";
import { Input } from "../components/ui/Input";
import { GradientButton } from "../components/ui/GradientButton";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header onBack={() => router.push("/(auth)/welcome")} />

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
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Ingresa tus datos para continuar</Text>

        {/* Email input */}
        <Input
          label="Correo electrónico"
          icon="mail-outline"
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password input */}
        <Input
          label="Contraseña"
          icon="lock-closed-outline"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          isPassword
        />

        {/* Forgot password */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
          style={styles.forgotWrapper}
        >
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {/* Button */}
        <GradientButton
          title="Continuar"
          onPress={() => router.replace("/(tabs)")}
        />

        {/* Register link */}
        <View style={styles.registerWrapper}>
          <Text style={styles.registerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.registerLink}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  subtitle: {
    color: "#1A1A1A99",
    marginBottom: 32,
  },
  forgotWrapper: {
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 32,
  },
  forgotText: {
    color: "#FF4F81",
    fontWeight: "500",
  },
  registerWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  registerText: {
    color: "#1A1A1A99",
  },
  registerLink: {
    color: "#FF4F81",
    fontWeight: "600",
  },
});
