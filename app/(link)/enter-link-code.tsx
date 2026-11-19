import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import linkService from "../../services/link.service";
import { palette, gradients } from "../../constants/colors";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { codeFromLink } from "../../utils/pendingLinkCode";
import { GradientButton } from "../components/ui/GradientButton";

// [qr-escaner] En web no hay escáner: solo el campo.
const CAN_SCAN = Platform.OS !== "web";

export default function EnterLinkCodeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  // Llega con ?code=… desde el QR de la pareja (nexus://enter-link-code?code=…) o desde Inicio.
  const params = useLocalSearchParams<{ code?: string; auto?: string }>();
  const [code, setCode] = useState(() => codeFromLink(params.code));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // [qr-escaner] Al volver del escáner (?auto=1) se conecta solo, una vez, con el código leído.
  const autoTried = useRef(false);
  useEffect(() => {
    if (params.auto !== "1" || autoTried.current || !user?.userId) return;
    if (codeFromLink(params.code).length < 6) return;
    autoTried.current = true;
    handleConnect();
  }, [params.auto, params.code, user?.userId]);

  const handleConnect = async () => {
    if (!user?.userId) return;
    
    // Remover el prefijo NEXUS- para obtener solo el código
    const cleanCode = codeFromLink(code);
    
    if (!cleanCode || cleanCode.length < 6) {
      setError("Revisa las 6 letras y números.");
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const data = await linkService.establishLink(user.userId, cleanCode);
      console.log("Vínculo establecido:", data);
      
      // Obtener el nombre de la pareja del response
      const partnerName = data.partner?.displayName || data.partner?.nickname || "tu pareja";
      
      // Figma H7: Inicio con el modal "¡Ya están vinculados!"
      router.replace({
        pathname: "/(tabs)",
        params: { linked: partnerName }
      });
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "No se pudo establecer el vínculo");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Únete a tu pareja" onBack={() => router.back()} />

      {/* Content */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 500 }}
        style={styles.content}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={gradients.soft}
            style={styles.iconGradient}
          >
            <Ionicons name="link" size={48} color={palette.primary} />
          </LinearGradient>
        </View>

        <Text style={styles.heading}>Conecta con tu pareja</Text>
        <Text style={styles.subtitle}>
          {CAN_SCAN
            ? "Escanea el QR que aparece en su teléfono o escribe su código."
            : "Ingresa el código único que tu pareja te compartió"}
        </Text>

        {CAN_SCAN && (
          <>
            <GradientButton
              title="Escanear QR"
              onPress={() => router.push("/(link)/scan-link-qr")}
              disabled={loading}
              style={styles.scanButton}
            />
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>o escribe su código</Text>
              <View style={styles.orLine} />
            </View>
          </>
        )}

        {/* Code input */}
        <View style={styles.inputContainer}>
          {!CAN_SCAN && <Text style={styles.inputLabel}>Código de vínculo</Text>}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>NEXUS  - </Text>
            <TextInput
              value={code}
              onChangeText={(text) => {
                // [vinculo-pegar] Acepta lo pegado con «NEXUS-» (así lo copia «Copiar»); deja 6 letras y números.
                setCode(codeFromLink(text));
              }}
              placeholder="XXXXXX"
              placeholderTextColor={palette.textMuted}
              style={styles.inputField}
              autoCapitalize="characters"
              editable={!loading}
            />
          </View>
        </View>

        {/* Connect button */}
        <TouchableOpacity accessibilityRole="button"
          style={[styles.connectButtonWrapper, (!code || code.length < 6 || loading) && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={!code || code.length < 6 || loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.connectButton}
          >
            {loading ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text style={styles.connectButtonText}>Conectar</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Alternative option */}
        <View style={styles.alternativeContainer}>
          <Text style={styles.alternativeLabel}>¿Todavía no te invita?</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.push("/(link)/my-link-code")}>
            <Text style={styles.alternativeLink}>Comparte el tuyo primero</Text>
          </TouchableOpacity>
        </View>

        {/* Help text */}
        <View style={styles.helpBox}>
          <Text style={styles.helpText}>
            Pídele que entre a Pareja → Invitar a mi pareja.
          </Text>
        </View>
      </MotiView>

      {/* Modals */}
      <ErrorModal
        visible={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
      <SuccessModal
        visible={showSuccess}
        message="¡Ya están vinculados!"
        onClose={() => setShowSuccess(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  scanButton: {
    alignSelf: "stretch",
    marginBottom: 20,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 12,
    marginBottom: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
  },
  orText: {
    fontSize: 13,
    color: palette.textMuted,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    color: palette.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: "center",
    marginBottom: 48,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    color: palette.text,
    marginBottom: 8,
  },
  inputWrapper: {
    width: "100%",
    height: 56,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  inputPrefix: {
    fontSize: 20,
    fontWeight: "400",
    color: palette.textMuted,
    marginRight: 0,
    letterSpacing: 4,
  },
  inputField: {
    flex: 0,
    width: 120,
    height: 56,
    color: palette.text,
    fontSize: 20,
    fontWeight: "400",
    letterSpacing: 4,
    padding: 0,
    textAlign: "center",
    marginLeft: 0,
  },
  connectButtonWrapper: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  connectButton: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  connectButtonText: {
    color: palette.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  alternativeContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  alternativeLabel: {
    fontSize: 13,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  alternativeLink: {
    fontSize: 14,
    color: palette.textAccent,
    fontWeight: "500",
  },
  helpBox: {
    marginTop: "auto",
    marginBottom: 32,
    backgroundColor: palette.secondarySoft,
    borderRadius: 20,
    padding: 16,
  },
  helpText: {
    fontSize: 13,
    color: palette.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
