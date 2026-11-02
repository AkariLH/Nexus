import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";
import { ErrorModal } from "../components/ErrorModal";
import { Header } from "../components/layout/Header";
import { GradientButton } from "../components/ui/GradientButton";
import { Input } from "../components/ui/Input";

interface LoginError {
  message: string;
  action?: { text: string; onPress: () => void };
}

/** Figma H5: "Iniciar sesión". */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<LoginError | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    // FA01: formato de correo (RN-24).
    const emailIssue = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "" : "Escribe un correo electrónico válido.";
    const passwordIssue = password ? "" : "Escribe tu contraseña.";
    setEmailError(emailIssue);
    setPasswordError(passwordIssue);
    if (emailIssue || passwordIssue) return;

    setLoading(true);
    const result = await authService.login({ email: email.trim(), password });
    setLoading(false);

    if (result.error || !result.data?.token) {
      const message = result.error?.message || result.data?.message || "No se pudo iniciar sesión.";
      // FA03: cuenta sin verificar (RN-02).
      if (/confirma tu correo|verificar tu correo/i.test(message)) {
        setModal({
          message,
          action: {
            text: "Verificar mi correo",
            onPress: () => {
              setModal(null);
              router.push({ pathname: "/(auth)/verify-email", params: { email: email.trim(), from: "login" } });
            },
          },
        });
      } else {
        // FA04 y FA05: credenciales incorrectas o cuenta bloqueada (RN-03).
        setModal({ message });
      }
      return;
    }

    const data = result.data;
    await login(
      {
        userId: data.userId!,
        email: data.email,
        displayName: data.displayName!,
        nickname: data.nickname,
        linkCode: data.linkCode!,
        emailConfirmed: data.emailConfirmed,
      },
      data.token!,
      data.tokenExpiresAt
    );
    // _layout.tsx lleva a la app; el cuestionario lo revisa Inicio.
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header onBack={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/welcome"))} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">Iniciar sesión</Text>
        <Text style={styles.subtitle}>Entra con tu correo y tu contraseña.</Text>

        <Input
          label="Correo electrónico"
          placeholder="tu@correo.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError("");
          }}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <Input
          ref={passwordRef}
          label="Contraseña"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError("");
          }}
          error={passwordError}
          isPassword
          autoComplete="current-password"
          editable={!loading}
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
          disabled={loading}
          accessibilityRole="link"
          hitSlop={8}
          style={styles.forgot}
        >
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GradientButton title="Entrar" onPress={handleLogin} loading={loading} />
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>¿Aún no tienes cuenta? </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/register")}
            disabled={loading}
            accessibilityRole="link"
            hitSlop={8}
          >
            <Text style={styles.link}>Crea una</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ErrorModal
        visible={!!modal}
        message={modal?.message ?? ""}
        actionButton={modal?.action}
        onClose={() => setModal(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: "700", color: palette.text },
  subtitle: { marginTop: 6, marginBottom: 24, fontSize: 14, color: palette.textSecondary },
  forgot: { alignSelf: "flex-start", paddingVertical: 4 },
  link: { fontSize: 14, fontWeight: "700", color: palette.textAccent },
  footer: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },
  switchRow: { flexDirection: "row", justifyContent: "center" },
  switchText: { fontSize: 14, color: palette.textSecondary },
});
