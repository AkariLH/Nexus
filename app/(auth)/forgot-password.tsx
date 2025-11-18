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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

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
      <Header onBack={() => router.push("/(auth)/login")} />

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
          <Ionicons name="lock-closed-outline" size={48} color="#FF4F81" />
        </View>

        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo electrónico y te enviaremos instrucciones para recuperar tu cuenta
        </Text>

        <View style={styles.formContainer}>
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

          {/* Submit button */}
          <GradientButton
            title="Enviar instrucciones"
            disabled={!email}
            onPress={() => router.push("/(auth)/reset-password")}
            style={{ marginTop: 12 }}
          />

          {/* Back to login */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={styles.backLogin}
          >
            <Text style={styles.backLoginText}>Volver a iniciar sesión</Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 79, 129, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#1A1A1A",
    opacity: 0.6,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 20,
  },
  formContainer: {
    width: "100%",
  },
  backLogin: {
    marginTop: 24,
    alignItems: "center",
  },
  backLoginText: {
    color: "#FF4F81",
    fontWeight: "600",
    fontSize: 14,
  },
});
