import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, gradients } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import linkService, { LinkCodeResponse } from "../../services/link.service";
import { GradientButton } from "../components/ui/GradientButton";
import { Input } from "../components/ui/Input";
import { inviteMessage } from "../../utils/pendingLinkCode";

const PREFIX = "NEXUS-";
const CODE_LENGTH = 6;

/** Figma H6: despues del cuestionario, compartir el codigo propio o escribir el de la pareja. */
export default function ConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [myCode, setMyCode] = useState<LinkCodeResponse | null>(null);
  const [expired, setExpired] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [copied, setCopied] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  // H7: al quedar vinculados se abre Inicio con el modal "¡Ya están vinculados!".
  const goLinked = useCallback(
    (partnerName: string) => router.replace({ pathname: "/(tabs)", params: { linked: partnerName } }),
    [router]
  );

  const generate = useCallback(async () => {
    if (!user?.userId) return;
    setCodeError("");
    setExpired(false);
    setCopied(false);
    try {
      setMyCode(await linkService.generateCode(user.userId));
    } catch (error: any) {
      setCodeError(error?.message || "No se pudo crear tu código.");
    }
  }, [user?.userId]);

  useEffect(() => {
    generate();
  }, [generate]);

  // El codigo vence; al vencer se ofrece otro.
  useEffect(() => {
    if (!myCode) return;
    const left = new Date(myCode.expiresAt).getTime() - Date.now();
    if (left <= 0) {
      setExpired(true);
      return;
    }
    const timer = setTimeout(() => setExpired(true), left);
    return () => clearTimeout(timer);
  }, [myCode]);

  // Si la pareja usa mi codigo, esta pantalla se entera sola.
  useEffect(() => {
    if (!user?.userId || !myCode || expired) return;
    const check = async () => {
      try {
        const status = await linkService.getLinkStatus(user.userId);
        if (status.hasActiveLink && status.partner) {
          goLinked(status.partner.displayName || status.partner.nickname || "tu pareja");
        }
      } catch {
        // Sin red se vuelve a intentar en el siguiente ciclo.
      }
    };
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, [user?.userId, myCode, expired, goLinked]);

  const fullCode = myCode ? `${PREFIX}${myCode.code}` : "";

  const copy = () => {
    if (!fullCode) return;
    Clipboard.setString(fullCode);
    setCopied(true);
  };

  const share = async () => {
    if (!myCode) return;
    try {
      await Share.share({
        message: inviteMessage(myCode.code, myCode.validityMinutes, process.env.EXPO_PUBLIC_INVITE_URL),
      });
    } catch {
      // La persona cerro el menu de compartir.
    }
  };

  const connect = async () => {
    if (!user?.userId || partnerCode.length < CODE_LENGTH) return;
    setConnecting(true);
    setConnectError("");
    try {
      const status = await linkService.establishLink(user.userId, partnerCode);
      goLinked(status.partner?.displayName || status.partner?.nickname || "tu pareja");
    } catch (error: any) {
      setConnectError(error?.message || "No se pudo conectar. Revisa las 6 letras y números.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
          <Ionicons name="link-outline" size={36} color={palette.onPrimary} />
        </LinearGradient>
        <Text style={styles.title} accessibilityRole="header">Conecta con tu pareja</Text>
        <Text style={styles.subtitle}>Nexus funciona de a dos: el calendario y las citas se comparten.</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Invita a tu pareja</Text>
          <View style={styles.codeBox}>
            {myCode ? (
              <Text style={[styles.code, expired && styles.codeExpired]} selectable accessibilityLabel={`Tu código: ${fullCode}`}>
                {fullCode}
              </Text>
            ) : codeError ? (
              <Text style={styles.codeErrorText}>{codeError}</Text>
            ) : (
              <ActivityIndicator color={palette.secondary} />
            )}
          </View>

          {expired || codeError ? (
            <TouchableOpacity onPress={generate} accessibilityRole="button" style={styles.regenerate} hitSlop={8}>
              <Ionicons name="refresh-outline" size={18} color={palette.textAccent} />
              <Text style={styles.regenerateText}>{expired ? "La invitación venció. Crear otra" : "Intentar de nuevo"}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={copy}
                  disabled={!myCode}
                  accessibilityRole="button"
                  accessibilityLabel={copied ? "Código copiado" : "Copiar código"}
                >
                  <Text style={styles.outlineText}>{copied ? "Copiado" : "Copiar"}</Text>
                </TouchableOpacity>
                <GradientButton title="Compartir" onPress={share} disabled={!myCode} style={styles.half} />
              </View>
              {myCode && (
                <Text style={styles.hint}>Vence en {myCode.validityMinutes} minutos y sirve una sola vez.</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.dividerRow} importantForAccessibility="no-hide-descendants">
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardQuestion}>¿Tu pareja ya te invitó?</Text>
          <Input
            accessibilityLabel="Código de tu pareja"
            value={`${PREFIX}${partnerCode}`}
            onChangeText={(text) => {
              const clean = text.toUpperCase().replace(/^NEXUS-?/, "").replace(/[^A-Z0-9]/g, "");
              setPartnerCode(clean.slice(0, CODE_LENGTH));
              if (connectError) setConnectError("");
            }}
            error={connectError}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!connecting}
            returnKeyType="go"
            onSubmitEditing={connect}
          />
          <GradientButton
            title="Conectar"
            onPress={connect}
            loading={connecting}
            disabled={partnerCode.length < CODE_LENGTH}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.later}>Hacerlo más tarde</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { alignItems: "center", paddingHorizontal: 16, paddingBottom: 24 },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: palette.text, textAlign: "center" },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 21,
    color: palette.textSecondary,
    textAlign: "center",
  },
  card: {
    alignSelf: "stretch",
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.surface,
    gap: 14,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLabel: { fontSize: 14, fontWeight: "600", color: palette.textSecondary, textAlign: "center" },
  cardQuestion: { fontSize: 15, fontWeight: "600", color: palette.text, marginBottom: -4 },
  codeBox: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: palette.secondarySoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  code: { fontSize: 24, fontWeight: "700", letterSpacing: 2, color: palette.textAccent },
  codeExpired: { opacity: 0.4 },
  codeErrorText: { fontSize: 14, color: palette.error, textAlign: "center" },
  actions: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  outlineButton: {
    flex: 1,
    height: 56,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: { fontSize: 16, fontWeight: "700", color: palette.textAccent },
  hint: { fontSize: 12, color: palette.textSecondary, textAlign: "center" },
  regenerate: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 },
  regenerateText: { fontSize: 14, fontWeight: "700", color: palette.textAccent },
  dividerRow: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.border },
  dividerText: { fontSize: 14, color: palette.textSecondary },
  footer: { alignItems: "center", paddingTop: 8 },
  later: { fontSize: 15, fontWeight: "700", color: palette.textAccent, paddingVertical: 8 },
});
