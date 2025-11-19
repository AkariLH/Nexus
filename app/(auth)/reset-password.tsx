import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Header } from "../components/layout/Header";
import { GradientButton } from "../components/ui/GradientButton";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { authService } from "../../services/auth.service";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifiedCode, setVerifiedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });
  const [successModal, setSuccessModal] = useState({ visible: false, message: "" });
  const [infoModal, setInfoModal] = useState({ visible: false, message: "" });

  const inputs = useRef<TextInput[]>([]);
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

  const validatePassword = (password: string): boolean => {
    // RN-01: Política de contraseña segura
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-\[\]{};':"\\|,.<>/?]).{8,}$/;
    return passwordPolicy.test(password);
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join("");

    // Validación del código
    if (!verificationCode || verificationCode.length < 6) {
      setErrorModal({
        visible: true,
        message: "Por favor ingresa el código de 6 dígitos",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar código con el backend antes de permitir el cambio de contraseña
      const result = await authService.verifyResetCode({
        email,
        code: verificationCode,
      });

      if (result.error) {
        setErrorModal({
          visible: true,
          message: result.error.message || "Error al verificar el código",
        });
      } else {
        // Verificar si el código estaba expirado y se envió uno nuevo
        if (result.data?.message?.includes("expirado")) {
          setInfoModal({
            visible: true,
            message: result.data.message,
          });
          // Limpiar el código para que ingrese el nuevo
          setCode(["", "", "", "", "", ""]);
        } else {
          // Código verificado, guardar y pasar al siguiente paso
          setVerifiedCode(verificationCode);
          setStep("reset");
          
          // Reiniciar animaciones para el nuevo paso
          fadeAnim.setValue(0);
          slideAnim.setValue(20);
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
        }
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

  const handleResendCode = async () => {
    setIsResending(true);

    try {
      const result = await authService.resendResetCode(email);

      if (result.error) {
        setErrorModal({
          visible: true,
          message: result.error.message || "Error al reenviar el código",
        });
      } else {
        setInfoModal({
          visible: true,
          message: "Se ha enviado un nuevo código a tu correo",
        });
        // Limpiar el código
        setCode(["", "", "", "", "", ""]);
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        message: "Ocurrió un error inesperado. Intenta nuevamente.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async () => {
    // Validaciones
    if (!newPassword) {
      setErrorModal({
        visible: true,
        message: "Por favor ingresa tu nueva contraseña",
      });
      return;
    }

    // RN-01: Validar política de contraseña
    if (!validatePassword(newPassword)) {
      setErrorModal({
        visible: true,
        message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorModal({
        visible: true,
        message: "Las contraseñas no coinciden",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.resetPassword({
        email,
        code: verifiedCode,
        newPassword,
        confirmPassword,
      });

      if (result.error) {
        setErrorModal({
          visible: true,
          message: result.error.message || "Error al restablecer la contraseña",
        });
      } else {
        setSuccessModal({
          visible: true,
          message: "Contraseña restablecida exitosamente",
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
    router.replace("/(auth)/login");
  };

  const isCodeComplete = code.every((d) => d);

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
            <Ionicons name="key-outline" size={48} color="#FF4F81" />
          </View>

          {step === "verify" ? (
            <>
              {/* PASO 1: Verificar código */}
              <Text style={styles.title}>Verifica tu código</Text>
              <Text style={styles.subtitle}>
                Ingresa el código que enviamos a{"\n"}
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
                    editable={!isLoading}
                  />
                ))}
              </View>

              {/* Botón verificar código */}
              <View style={styles.buttonContainer}>
                <GradientButton
                  title={isLoading ? "Verificando..." : "Verificar código"}
                  disabled={!isCodeComplete || isLoading}
                  onPress={handleVerifyCode}
                />
              </View>

              {/* Enlace para reenviar código */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>¿No recibiste el código? </Text>
                <Text
                  style={[styles.resendLink, isResending && styles.resendLinkDisabled]}
                  onPress={isResending ? undefined : handleResendCode}
                >
                  {isResending ? "Enviando..." : "Reenviar código"}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* PASO 2: Nueva contraseña */}
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
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    style={styles.input}
                    editable={!isLoading}
                  />
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#1A1A1A66"
                    style={styles.iconRight}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
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
                    editable={!isLoading}
                  />
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#1A1A1A66"
                    style={styles.iconRight}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </View>
              </View>

              {/* Hint de contraseña */}
              <Text style={styles.passwordHint}>
                La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales
              </Text>

              {/* Botón restablecer */}
              <View style={styles.buttonContainer}>
                <GradientButton
                  title={isLoading ? "Restableciendo..." : "Restablecer contraseña"}
                  disabled={!newPassword || !confirmPassword || isLoading}
                  onPress={handleResetPassword}
                />
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#FF4F81"
                    style={styles.loader}
                  />
                )}
              </View>
            </>
          )}
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

      <SuccessModal
        visible={infoModal.visible}
        title="Información"
        message={infoModal.message}
        buttonText="Entendido"
        onClose={() => setInfoModal({ visible: false, message: "" })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFF" 
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
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
    lineHeight: 20,
  },
  emailHighlight: {
    color: "#FF4F81",
    fontWeight: "600",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    textAlign: "center",
    fontSize: 24,
    color: "#1A1A1A",
    borderWidth: 2,
    borderColor: "transparent",
  },
  codeInputFilled: {
    borderColor: "#FF4F81",
    backgroundColor: "#FFF",
  },
  field: {
    marginBottom: 20,
  },
  label: {
    color: "#1A1A1A",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "500",
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
  passwordHint: {
    fontSize: 12,
    color: "#1A1A1A",
    opacity: 0.6,
    marginBottom: 24,
    lineHeight: 16,
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
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  resendText: {
    color: "#1A1A1A99",
    fontSize: 14,
  },
  resendLink: {
    color: "#FF4F81",
    fontSize: 14,
    fontWeight: "600",
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});
