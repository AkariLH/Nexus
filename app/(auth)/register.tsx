import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { palette, gradients } from "../../constants/colors";
import { authService } from "../../services/auth.service";
import type { RegisterRequest } from "../../types/auth.types";
import { birthDateLabel } from "../../utils/profileFormat";
import { emailProblem, fromBackendDate, isAdult, nicknameOrName, passwordProblem, toBackendDate } from "../../utils/registerForm";
import { WebDateInput } from "../../components/ui/WebDateInput";
import { ErrorModal } from "../components/ErrorModal";
import { Header } from "../components/layout/Header";
import { GradientButton } from "../components/ui/GradientButton";
import { Input } from "../components/ui/Input";
import { StepBar } from "../components/ui/StepBar";

const PASSWORD_RULES = "Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.";

/** Figma H2 (correo y contrasena) y H3 (datos de la persona): crear cuenta en 2 pasos. */
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // "¿Escribiste mal tu correo? Cámbialo" (H4) regresa aqui con el correo escrito.
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [errorModal, setErrorModal] = useState<{ title?: string; message: string } | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const nicknameRef = useRef<TextInput>(null);

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (router.canGoBack()) router.back();
    else router.replace("/(auth)/welcome");
  };

  // H2: el correo (FA02) y la contrasena (RN-01) se revisan al continuar.
  const continueToDetails = () => {
    const emailIssue = emailProblem(email);
    const passwordIssue = passwordProblem(password);
    setEmailError(emailIssue ?? "");
    setPasswordError(passwordIssue ?? "");
    if (!emailIssue && !passwordIssue) setStep(2);
  };

  const onDateChange = (_event: unknown, selected?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (!selected) return;
    setBirthDate(selected);
    setBirthDateError(isAdult(selected) ? "" : "Nexus es solo para mayores de 18 años.");
  };

  const createAccount = async () => {
    const nameIssue = name.trim().length < 2 ? "Escribe tu nombre." : "";
    const dateIssue = !birthDate
      ? "Elige tu fecha de nacimiento."
      : isAdult(birthDate) ? "" : "Nexus es solo para mayores de 18 años.";
    setNameError(nameIssue);
    setBirthDateError(dateIssue);
    if (nameIssue || dateIssue || !birthDate || !termsAccepted) return;

    const request: RegisterRequest = {
      email: email.trim(),
      password,
      confirmPassword: password,
      displayName: name.trim(),
      nickname: nicknameOrName(nickname, name),
      birthDate: toBackendDate(birthDate),
      termsAccepted: true,
    };

    setLoading(true);
    const result = await authService.register(request);
    setLoading(false);

    if (result.data) {
      router.replace({ pathname: "/(auth)/verify-email", params: { email: request.email } });
      return;
    }

    const error = result.error;
    const message = error?.message ?? "No se pudo crear la cuenta. Inténtalo de nuevo.";
    const fieldErrors = error?.validationErrors ?? {};
    // FA01: correo ya registrado → de vuelta al paso 1, sobre el campo.
    if (/correo|email|already exists/i.test(message) && !/send|enviar/i.test(message)) {
      setEmailError("Este correo ya tiene una cuenta. Inicia sesión o usa otro.");
      setStep(1);
      return;
    }
    if (fieldErrors.email || fieldErrors.password) {
      setEmailError(fieldErrors.email ?? "");
      setPasswordError(fieldErrors.password ?? "");
      setStep(1);
      return;
    }
    if (fieldErrors.birthDate) setBirthDateError(fieldErrors.birthDate);
    const others = Object.entries(fieldErrors)
      .filter(([key]) => !["email", "password", "birthDate"].includes(key))
      .map(([, value]) => value)
      .join("\n");
    if (others || !fieldErrors.birthDate) {
      setErrorModal({ title: "No se pudo crear la cuenta", message: others || message });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header onBack={goBack} />
      <View style={styles.bar}>
        <StepBar step={step} total={2} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <>
            <Text style={styles.title} accessibilityRole="header">Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Con tu correo inicias sesión en cualquier teléfono.</Text>

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
              isPassword
              help={PASSWORD_RULES}
              error={passwordError}
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={continueToDetails}
            />
          </>
        ) : (
          <>
            <Text style={styles.title} accessibilityRole="header">Cuéntanos de ti</Text>
            <Text style={styles.subtitle}>Así te verá tu pareja en Nexus.</Text>

            <Input
              label="Nombre"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError("");
              }}
              error={nameError}
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => nicknameRef.current?.focus()}
            />
            <Input
              ref={nicknameRef}
              label="Apodo (opcional)"
              value={nickname}
              onChangeText={setNickname}
              help="Si lo dejas vacío, usamos tu nombre."
            />

            <View style={styles.field}>
              <Text style={styles.label}>Fecha de nacimiento</Text>
              {Platform.OS === "web" ? (
                <WebDateInput
                  value={birthDate ? toBackendDate(birthDate) : ""}
                  onChange={(iso) => onDateChange(null, fromBackendDate(iso) ?? undefined)}
                  min="1900-01-01"
                  max={toBackendDate(new Date())}
                  invalid={!!birthDateError}
                  accessibilityLabel="Fecha de nacimiento"
                />
              ) : (
              <TouchableOpacity
                style={[styles.dateField, !!birthDateError && styles.dateFieldError]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Fecha de nacimiento: ${birthDate ? birthDateLabel(toBackendDate(birthDate)) : "sin elegir"}`}
              >
                <Text style={[styles.dateText, !birthDate && styles.datePlaceholder]}>
                  {birthDate ? birthDateLabel(toBackendDate(birthDate)) : "Elige tu fecha"}
                </Text>
              </TouchableOpacity>
              )}
              <Text style={birthDateError ? styles.fieldError : styles.fieldHelp}>
                {birthDateError || "Nexus es para mayores de 18 años."}
              </Text>
            </View>

            {showDatePicker && Platform.OS !== "web" && (
              <DateTimePicker
                value={birthDate || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                accentColor={palette.secondary}
                textColor={palette.text}
              />
            )}

            <TouchableOpacity
              style={styles.terms}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
            >
              {termsAccepted ? (
                <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.checkbox}>
                  <Ionicons name="checkmark" size={16} color={palette.onPrimary} />
                </LinearGradient>
              ) : (
                <View style={[styles.checkbox, styles.checkboxEmpty]} />
              )}
              <Text style={styles.termsText}>Acepto los términos y el aviso de privacidad</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step === 1 ? (
          <>
            <GradientButton title="Continuar" onPress={continueToDetails} />
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")} accessibilityRole="link" hitSlop={8}>
                <Text style={styles.switchLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <GradientButton
            title="Crear cuenta"
            onPress={createAccount}
            loading={loading}
            disabled={!termsAccepted}
          />
        )}
      </View>

      <ErrorModal
        visible={!!errorModal}
        title={errorModal?.title}
        message={errorModal?.message ?? ""}
        onClose={() => setErrorModal(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  bar: { paddingHorizontal: 16, paddingBottom: 8 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: "700", color: palette.text },
  subtitle: { marginTop: 6, marginBottom: 24, fontSize: 14, color: palette.textSecondary },
  field: { marginBottom: 20 },
  label: { color: palette.text, marginBottom: 8, fontSize: 14, fontWeight: "600" },
  dateField: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  dateFieldError: { borderWidth: 2, borderColor: palette.error },
  dateText: { fontSize: 16, color: palette.text },
  datePlaceholder: { color: palette.textMuted },
  fieldHelp: { marginTop: 6, fontSize: 12, lineHeight: 16, color: palette.textSecondary },
  fieldError: { marginTop: 6, fontSize: 12, lineHeight: 16, color: palette.error },
  terms: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  checkboxEmpty: { borderWidth: 2, borderColor: palette.border, backgroundColor: palette.surface },
  termsText: { flex: 1, fontSize: 14, color: palette.text },
  footer: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },
  switchRow: { flexDirection: "row", justifyContent: "center" },
  switchText: { fontSize: 14, color: palette.textSecondary },
  switchLink: { fontSize: 14, fontWeight: "700", color: palette.textAccent },
});
