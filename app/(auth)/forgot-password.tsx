import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Header } from "../components/layout/Header";
import { Input } from "../components/ui/Input";
import { GradientButton } from "../components/ui/GradientButton";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { authService } from "../../services/auth.service";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });
  const [successModal, setSuccessModal] = useState({ visible: false, message: "" });

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validación RN-24
    if (!email.trim()) {
      setErrorModal({
        visible: true,
        message: "Por favor ingresa tu correo electrónico",
      });
      return;
    }

    if (!validateEmail(email)) {
      setErrorModal({
        visible: true,
        message: "El formato del correo electrónico no es válido",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.forgotPassword({ email: email.trim() });

      if (result.error) {
        setErrorModal({
          visible: true,
          message: result.error.message || "Error al solicitar recuperación de contraseña",
        });
      } else {
        setSuccessModal({
          visible: true,
          message: "Si el correo está registrado, recibirás un código de recuperación",
        });
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        message: "Ocurrió un error inesperado. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModal({ visible: false, message: "" });
    // Redirigir a pantalla de reset con el email
    router.push({
      pathname: "/(auth)/reset-password",
      params: { email }
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Header onBack={() => router.back()} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Ícono */}
          <View style={styles.iconWrapper}>
            <Ionicons name="lock-closed-outline" size={48} color="#FF4F81" />
          </View>

          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>
            Ingresa tu correo electrónico y te enviaremos un código para recuperar tu contraseña
          </Text>

          <View style={styles.formContainer}>
            {/* Input de email */}
            <Input
              label="Correo electrónico"
              icon="mail-outline"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />

            {/* Submit button */}
            <View style={styles.buttonContainer}>
              <GradientButton
                title={isLoading ? "Enviando..." : "Enviar código"}
                disabled={!email.trim() || isLoading}
                onPress={handleSubmit}
                style={{ marginTop: 12 }}
              />
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color="#FF4F81"
                  style={styles.loader}
                />
              )}
            </View>

            {/* Back to login */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={styles.backLogin}
            >
              <Text style={styles.backLoginText}>Volver a iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modales */}
      <ErrorModal
        visible={errorModal.visible}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, message: "" })}
      />

      <SuccessModal
        visible={successModal.visible}
        message={successModal.message}
        onClose={handleSuccessClose}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: "center",
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 79, 129, 0.1)",
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
    fontSize: 14,
    color: "#1A1A1A99",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  formContainer: {
    width: "100%",
  },
  buttonContainer: {
    position: "relative",
  },
  loader: {
    position: "absolute",
    right: 20,
    top: 26,
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
