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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Header } from "../components/layout/Header";
import { Input } from "../components/ui/Input";
import { GradientButton } from "../components/ui/GradientButton";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ 
    visible: false, 
    message: "",
    actionButton: undefined as { text: string; onPress: () => void } | undefined,
  });
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

  // FA01: Validación de formato de email (RN-24)
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResendVerificationCode = async () => {
    setErrorModal({ visible: false, message: "", actionButton: undefined });
    setIsLoading(true);

    try {
      const result = await authService.resendVerificationCode(email);

      if (result.error) {
        setErrorModal({
          visible: true,
          message: result.error.message || "Error al reenviar el código",
          actionButton: undefined,
        });
      } else {
        setSuccessModal({
          visible: true,
          message: "Código de verificación reenviado. Revisa tu correo electrónico.",
        });
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        message: "Ocurrió un error inesperado. Intenta nuevamente.",
        actionButton: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    // FA01: Validar formato de email (RN-24)
    if (!email || !validateEmail(email)) {
      setErrorModal({
        visible: true,
        message: "Por favor ingresa un correo electrónico válido",
        actionButton: undefined,
      });
      return;
    }

    // Validar que la contraseña no esté vacía
    if (!password) {
      setErrorModal({
        visible: true,
        message: "Por favor ingresa tu contraseña",
        actionButton: undefined,
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.login({
        email,
        password,
      });

      if (result.error) {
        // FA03: Cuenta no verificada (RN-02)
        if (result.error.message?.includes("verificar tu correo")) {
          setErrorModal({
            visible: true,
            message: result.error.message,
            actionButton: {
              text: "Verificar cuenta",
              onPress: () => {
                setErrorModal({ visible: false, message: "", actionButton: undefined });
                router.push({
                  pathname: "/(auth)/verify-email",
                  params: { email }
                });
              },
            },
          });
        } 
        // FA04 y FA05: Credenciales incorrectas o cuenta bloqueada (RN-03)
        else {
          setErrorModal({
            visible: true,
            message: result.error.message || "Error al iniciar sesión",
            actionButton: undefined,
          });
        }
      } else {
        // Login exitoso - Guardar usuario en contexto
        await login({
          userId: result.data!.userId!,
          email: result.data!.email,
          displayName: result.data!.displayName!,
          nickname: result.data?.nickname,
          linkCode: result.data!.linkCode!,
          emailConfirmed: result.data!.emailConfirmed,
        });
        
        setSuccessModal({
          visible: true,
          message: `¡Bienvenido de vuelta, ${result.data?.displayName || ""}!`,
        });
        
        // Redirigir al panel principal después de un breve delay
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      }
    } catch (error) {
      // FA06: Error general
      setErrorModal({
        visible: true,
        message: "Ocurrió un error inesperado. Por favor intenta más tarde.",
        actionButton: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Header onBack={() => router.push("/(auth)/welcome")} />

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
            editable={!isLoading}
          />

          {/* Password input */}
          <Input
            label="Contraseña"
            icon="lock-closed-outline"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            editable={!isLoading}
          />

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            style={styles.forgotWrapper}
            disabled={isLoading}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <GradientButton
              title={isLoading ? "Iniciando sesión..." : "Continuar"}
              onPress={handleLogin}
              disabled={isLoading}
            />
            {isLoading && (
              <ActivityIndicator
                size="small"
                color="#FF4F81"
                style={styles.loader}
              />
            )}
          </View>

          {/* Register link */}
          <View style={styles.registerWrapper}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity 
              onPress={() => router.push("/(auth)/register")}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modales */}
      <ErrorModal
        visible={errorModal.visible}
        message={errorModal.message}
        actionButton={errorModal.actionButton}
        onClose={() => setErrorModal({ visible: false, message: "", actionButton: undefined })}
      />

      <SuccessModal
        visible={successModal.visible}
        message={successModal.message}
        onClose={() => setSuccessModal({ visible: false, message: "" })}
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
  buttonContainer: {
    position: "relative",
    marginBottom: 24,
  },
  loader: {
    position: "absolute",
    right: 20,
    top: 18,
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
