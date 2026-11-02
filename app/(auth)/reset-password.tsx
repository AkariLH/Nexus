import { Ionicons } from "@expo/vector-icons";
import { motionMs } from "../../utils/motion";
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
import { passwordProblem } from "../../utils/registerForm";
import { Input } from "../components/ui/Input";
import { palette } from "../../constants/colors";

const PASSWORD_RULES = "Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifiedCode, setVerifiedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
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
        duration: motionMs(500),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: motionMs(500),
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

  const handleVerifyCode = async () => {
    const verificationCode = code.join("");

    // Validación del código
    if (!verificationCode || verificationCode.length < 6) {
      setErrorModal({
        visible: true,
        message: "Ingresa el código de 6 dígitos.",
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
          message: result.error.message || "Algo salió mal de nuestro lado. Intenta de nuevo en unos momentos.",
        });
      } else {
        // Verificar si el código estaba expirado y se envió uno nuevo
        const expiredMessage = result.data?.message ?? "";
        if (/venci/i.test(expiredMessage)) {
          setInfoModal({
            visible: true,
            message: expiredMessage,
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
              duration: motionMs(500),
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: motionMs(500),
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        message: "Algo salió mal de nuestro lado. Intenta de nuevo en unos momentos.",
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
          message: result.error.message || "Algo salió mal de nuestro lado. Intenta de nuevo en unos momentos.",
        });
      } else {
        setInfoModal({
          visible: true,
          message: "Te enviamos un código nuevo. Revisa tu bandeja de entrada.",
        });
        // Limpiar el código
        setCode(["", "", "", "", "", ""]);
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        message: "Algo salió mal de nuestro lado. Intenta de nuevo en unos momentos.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async () => {
    // E14 (RN-01): la primera regla que le falta, debajo del campo.
    const issue = newPassword ? passwordProblem(newPassword) : "Escribe tu nueva contraseña.";
    setPasswordError(issue ?? "");
    if (issue) return;

    setIsLoading(true);

    try {
      const result = await authService.resetPassword({
        email,
        code: verifiedCode,
        newPassword,
        confirmPassword: newPassword,
      });

      if (result.error) {
        setErrorModal({
          visible: true,
          message: result.error.message || "Algo salió mal de nuestro lado. Intenta de nuevo en unos momentos.",
        });
      } else {
        setSuccessModal({
          visible: true,
          message: "Tu contraseña se actualizó. Ya puedes iniciar sesión.",
        });
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        message: "Algo salió mal de nuestro lado. Intenta de nuevo en unos momentos.",
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
            <Ionicons name="key-outline" size={48} color={palette.primary} />
          </View>

          {step === "verify" ? (
            <>
              {/* PASO 1: Verificar código */}
              <Text style={styles.title}>Revisa tu correo</Text>
              <Text style={styles.subtitle}>
                Ingresa el código que te enviamos a{"\n"}
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
                  title={isLoading ? "Verificando…" : "Verificar código"}
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
                  {isResending ? "Enviando…" : "Reenviar código"}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* PASO 2: Nueva contraseña */}
              <Text style={styles.title}>Nueva contraseña</Text>
              <Text style={styles.subtitle}>
                Elige una contraseña nueva para tu cuenta.
              </Text>

              {/* D3: una sola contraseña con el ojo, igual que al crear la cuenta. */}
              <Input
                label="Nueva contraseña"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (passwordError) setPasswordError("");
                }}
                isPassword
                help={PASSWORD_RULES}
                error={passwordError}
                autoComplete="new-password"
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
              />

              {/* Botón restablecer */}
              <View style={styles.buttonContainer}>
                <GradientButton
                  title={isLoading ? "Guardando…" : "Guardar contraseña"}
                  disabled={!newPassword || isLoading}
                  onPress={handleResetPassword}
                />
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color={palette.primary}
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
        title="¡Todo listo!"
        message={successModal.message}
        buttonText="Iniciar sesión"
        onClose={handleSuccessClose}
      />

      <SuccessModal
        visible={infoModal.visible}
        title="Revisa tu correo"
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
    backgroundColor: palette.surface 
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
    backgroundColor: palette.primarySoft,
    alignSelf: "center",
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
    marginBottom: 32,
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
    color: palette.textSecondary,
    fontSize: 14,
  },
  resendLink: {
    color: palette.textAccent,
    fontSize: 14,
    fontWeight: "600",
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});
