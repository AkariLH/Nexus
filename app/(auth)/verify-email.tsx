import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { Header } from "../components/layout/Header";
import { GradientButton } from "../components/ui/GradientButton";
import { ErrorModal } from "../components/ErrorModal";
import { authService } from "../../services/auth.service";
import { palette } from "../../constants/colors";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorModal, setErrorModal] = useState({ 
    visible: false, 
    message: "",
    type: "error" as "error" | "expired"
  });

  const inputs = useRef<TextInput[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    console.log("📧 Email recibido en verify-email:", email);
    console.log("📦 Params completos:", params);
    
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

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Focus siguiente input
      if (value && index < 5) {
        inputs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isComplete || isLoading) return;

    const verificationCode = code.join("");
    
    console.log("🔍 Verificando - Email:", email);
    console.log("🔍 Verificando - Código:", verificationCode);
    
    if (!email) {
      console.error("❌ Email no encontrado en params");
      setErrorModal({
        visible: true,
        message: "No se encontró el email. Por favor regresa al registro.",
        type: "error"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("📤 Verificando código...");
      const result = await authService.verifyEmail({
        email: email,
        code: verificationCode,
      });

      if (result.error) {
        console.error("❌ Error:", result.error);
        const errorMessage = result.error.message || "Error al verificar el código";
        
        // FA01: Código incorrecto
        // FA02: Código expirado
        const isExpired = errorMessage.toLowerCase().includes("expirado") || 
                         errorMessage.toLowerCase().includes("expired");
        
        setErrorModal({
          visible: true,
          message: errorMessage,
          type: isExpired ? "expired" : "error"
        });
        
        // Si el código está mal, limpiar los inputs
        if (!isExpired) {
          setCode(["", "", "", "", "", ""]);
          inputs.current[0]?.focus();
        }
      } else {
        console.log("✅ Verificación exitosa:", result.data);
        // Éxito - redirigir a pantalla de bienvenida
        router.replace({
          pathname: "/(auth)/welcome-verified",
          params: { 
            displayName: result.data?.nickname || result.data?.displayName || email 
          }
        });
      }
    } catch (error) {
      console.error("💥 Error inesperado:", error);
      setErrorModal({
        visible: true,
        message: "Ocurrió un error inesperado. Intenta nuevamente.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending || !email) return;

    setIsResending(true);
    console.log("🔄 Reenviando código a:", email);

    try {
      const result = await authService.resendVerificationCode(email);

      if (result.error) {
        setErrorModal({
          visible: true,
          message: result.error.message || "Error al reenviar el código",
          type: "error"
        });
      } else {
        // Limpiar el código actual
        setCode(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        
        // Mostrar mensaje de éxito
        setErrorModal({
          visible: true,
          message: "Se ha enviado un nuevo código a tu correo",
          type: "error" // Usamos el mismo modal pero con mensaje positivo
        });
      }
    } catch (error) {
      console.error("💥 Error al reenviar código:", error);
      setErrorModal({
        visible: true,
        message: "Error al reenviar el código. Intenta nuevamente.",
        type: "error"
      });
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = code.every((d) => d);

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
        {/* Ícono */}
        <View style={styles.iconWrapper}>
          <Ionicons name="mail-outline" size={48} color={palette.primary} />
        </View>

        <Text style={styles.title}>Verifica tu correo</Text>
        <Text style={styles.subtitle}>
          Ingresa el código de 6 dígitos que enviamos a{"\n"}
          <Text style={styles.emailHighlight}>{email || "tu correo"}</Text>
        </Text>

        {/* Inputs del código */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) {
                  inputs.current[index] = ref;
                }
              }}
              value={digit}
              onChangeText={(value) => handleCodeChange(index, value)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="numeric"
              maxLength={1}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
              ]}
            />
          ))}
        </View>

        {/* Submit button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title={isLoading ? "Verificando..." : "Verificar código"}
            disabled={!isComplete || isLoading}
            onPress={handleVerify}
          />
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={palette.primary}
              style={styles.loader}
            />
          )}
        </View>

        {/* Reenviar código */}
        <View style={styles.resendWrapper}>
          <Text style={styles.resendText}>¿No recibiste el código? </Text>
          <TouchableOpacity 
            onPress={handleResendCode} 
            disabled={isLoading || isResending}
          >
            <Text style={[styles.resendLink, (isResending || isLoading) && styles.resendLinkDisabled]}>
              {isResending ? "Reenviando..." : "Reenviar"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Modal de error */}
      <ErrorModal
        visible={errorModal.visible}
        message={errorModal.message}
        onClose={() => {
          setErrorModal({ visible: false, message: "", type: "error" });
        }}
        actionButton={errorModal.type === "expired" ? {
          text: "Solicitar nuevo código",
          onPress: () => {
            setErrorModal({ visible: false, message: "", type: "error" });
            handleResendCode();
          }
        } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
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
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: palette.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  emailHighlight: {
    color: palette.textAccent,
    fontWeight: "600",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 40,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderRadius: 16,
    backgroundColor: palette.surfaceMuted,
    textAlign: "center",
    fontSize: 24,
    color: palette.text,
    borderWidth: 2,
    borderColor: "transparent",
  },
  codeInputFilled: {
    borderColor: palette.primary,
    backgroundColor: palette.surface,
  },
  buttonContainer: {
    width: "100%",
    position: "relative",
  },
  loader: {
    position: "absolute",
    right: 20,
    top: 18,
  },
  resendWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  resendText: {
    color: palette.textSecondary,
  },
  resendLink: {
    color: palette.textAccent,
    fontWeight: "600",
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});
