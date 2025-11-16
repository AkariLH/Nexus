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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
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
          <Ionicons name="lock-closed-outline" size={48} color="#FF4F81" />
        </View>

        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo electrónico y te enviaremos instrucciones para
          recuperar tu cuenta
        </Text>

        {/* Email input */}
        <View style={styles.field}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#1A1A1A66"
              style={styles.iconLeft}
            />
            <TextInput
              placeholder="tu@email.com"
              placeholderTextColor="#1A1A1A66"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!email}
          style={[styles.buttonWrapper, !email && { opacity: 0.5 }]}
          onPress={() => router.push("/(auth)/reset-password")}
        >
          <LinearGradient
            colors={["#FF4F81", "#8A2BE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Enviar instrucciones</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Back to login */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={styles.backLogin}
        >
          <Text style={styles.backLoginText}>Volver a iniciar sesión</Text>
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,79,129,0.1)",
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
    width: "100%",
    marginBottom: 32,
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
  input: {
    height: "100%",
    paddingLeft: 44,
    fontSize: 16,
    color: "#1A1A1A",
  },
  buttonWrapper: {
    width: "100%",
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
  backLogin: {
    marginTop: 24,
  },
  backLoginText: {
    color: "#FF4F81",
    fontWeight: "600",
  },
});
