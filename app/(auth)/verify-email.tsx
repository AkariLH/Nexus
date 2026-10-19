import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, gradients } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";
import { countdownLabel } from "../../utils/countdown";
import { Header } from "../components/layout/Header";
import { CodeDigits } from "../components/ui/CodeDigits";
import { GradientButton } from "../components/ui/GradientButton";

const CODE_LENGTH = 6;
/** Segundos antes de poder pedir otro codigo. */
const RESEND_SECONDS = 60;
const EMPTY_CODE = Array<string>(CODE_LENGTH).fill("");

/** Figma H4: el codigo de 6 digitos. Al verificar se entra directo, sin volver a iniciar sesion. */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  // Desde "Iniciar sesión" (cuenta sin verificar) el codigo puede ser viejo: se puede pedir otro ya.
  const { email = "", from } = useLocalSearchParams<{ email?: string; from?: string }>();

  const [code, setCode] = useState<string[]>(EMPTY_CODE);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(from === "login" ? 0 : RESEND_SECONDS);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const complete = code.every((digit) => digit !== "");

  const verify = async () => {
    if (!complete || verifying) return;
    if (!email) {
      setError("No sabemos a qué correo se envió el código. Vuelve a crear tu cuenta.");
      return;
    }
    setVerifying(true);
    setError("");
    setInfo("");
    const result = await authService.verifyEmail({ email, code: code.join("") });
    const data = result.data;

    if (!data) {
      setVerifying(false);
      const message = result.error?.message || "No se pudo verificar el código.";
      // FA02: el codigo vencio; se puede pedir otro de inmediato.
      if (/expirad|expired/i.test(message)) {
        setError("El código venció. Pide uno nuevo.");
        setSecondsLeft(0);
      } else {
        // FA01: codigo incorrecto.
        setError(message);
        setCode(EMPTY_CODE);
      }
      return;
    }

    if (!data.token) {
      // Backend sin la sesion en verify-email: el correo ya quedo verificado, solo falta entrar.
      router.replace("/(auth)/login");
      return;
    }
    await login(
      {
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        nickname: data.nickname,
        linkCode: data.linkCode ?? "",
        emailConfirmed: true,
      },
      data.token,
      data.tokenExpiresAt
    );
    // Cuenta nueva: Inicio manda al cuestionario (D) y de ahi a conectar con la pareja (H6).
    router.replace("/(tabs)");
  };

  const resend = async () => {
    if (resending || secondsLeft > 0 || !email) return;
    setResending(true);
    setError("");
    const result = await authService.resendVerificationCode(email);
    setResending(false);
    if (result.error) {
      setError(result.error.message || "No se pudo reenviar el código.");
      return;
    }
    setCode(EMPTY_CODE);
    setInfo("Te enviamos un código nuevo.");
    setSecondsLeft(RESEND_SECONDS);
  };

  const changeEmail = () => router.replace({ pathname: "/(auth)/register", params: { email } });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header onBack={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/welcome"))} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
          <Ionicons name="mail-outline" size={40} color={palette.onPrimary} />
        </LinearGradient>

        <Text style={styles.title} accessibilityRole="header">Revisa tu correo</Text>
        <Text style={styles.subtitle}>
          Te enviamos un código de 6 dígitos a{"\n"}
          {email || "tu correo"}
        </Text>

        <View style={styles.digits}>
          <CodeDigits
            value={code}
            onChange={(next) => {
              setCode(next);
              if (error) setError("");
            }}
            editable={!verifying}
          />
        </View>

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
        ) : info ? (
          <Text style={styles.info} accessibilityLiveRegion="polite">{info}</Text>
        ) : null}

        {secondsLeft > 0 ? (
          <Text style={styles.resendWait}>Reenviar código en {countdownLabel(secondsLeft)}</Text>
        ) : (
          <TouchableOpacity onPress={resend} disabled={resending} accessibilityRole="button" hitSlop={10}>
            <Text style={styles.resendLink}>{resending ? "Reenviando…" : "Reenviar código"}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GradientButton title="Verificar" onPress={verify} loading={verifying} disabled={!complete} />
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>¿Escribiste mal tu correo? </Text>
          <TouchableOpacity onPress={changeEmail} accessibilityRole="link" hitSlop={8}>
            <Text style={styles.switchLink}>Cámbialo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { alignItems: "center", paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "700", color: palette.text, textAlign: "center" },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: palette.textSecondary,
    textAlign: "center",
  },
  digits: { marginTop: 24, marginBottom: 20 },
  error: { marginBottom: 12, fontSize: 13, color: palette.error, textAlign: "center" },
  info: { marginBottom: 12, fontSize: 13, color: palette.success, textAlign: "center" },
  resendWait: { fontSize: 14, color: palette.textSecondary },
  resendLink: { fontSize: 14, fontWeight: "700", color: palette.textAccent },
  footer: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },
  switchRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap" },
  switchText: { fontSize: 14, color: palette.textSecondary },
  switchLink: { fontSize: 14, fontWeight: "700", color: palette.textAccent },
});
