import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Share, Alert, Clipboard } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../context/AuthContext";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import linkService from "../../services/link.service";
import { palette, gradients } from "../../constants/colors";
import { ScreenHeader } from "../components/layout/ScreenHeader";

interface LinkCodeData {
  code: string;
  expiresAt: string;
  validityMinutes: number;
  message: string;
}

export default function MyLinkCodeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [linkCode, setLinkCode] = useState<LinkCodeData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [checkingLink, setCheckingLink] = useState(false);

  const generateLinkCode = useCallback(async () => {
    if (!user?.userId) return;

    console.log("Generando código para userId:", user.userId);
    setLoading(true);
    setIsExpired(false);
    try {
      const data: LinkCodeData = await linkService.generateCode(user.userId);
      console.log("Código generado:", data);
      setLinkCode(data);
    } catch (err: any) {
      console.error("Error generando código:", err);
      setError(err.message || "No se pudo generar el código");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (user?.userId) {
      generateLinkCode();
    }
  }, [user?.userId, generateLinkCode]);

  useEffect(() => {
    if (!linkCode) return;

    setIsExpired(false);
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = new Date(linkCode.expiresAt).getTime();
      const distance = expiryTime - now;

      if (distance < 0) {
        console.log("Código expirado, estableciendo isExpired = true");
        setIsExpired(true);
        clearInterval(interval);
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [linkCode]);

  // Polling para verificar si el código fue usado
  useEffect(() => {
    if (!user?.userId || !linkCode) return;

    const checkLinkStatus = async () => {
      try {
        setCheckingLink(true);
        const data = await linkService.getLinkStatus(user.userId);
        
        // Si el usuario ya tiene un vínculo establecido
        if (data.hasActiveLink && data.partner) {
          console.log('🎉 ¡Vínculo establecido! Redirigiendo a animación...');
          
          const partnerName = data.partner.displayName || data.partner.nickname || 'tu pareja';
          
          // Navegar a la pantalla de éxito con animación
          router.replace({
            pathname: '/(link)/link-success',
            params: { partnerName },
          });
        }
      } catch (error) {
        console.log('Error verificando estado del vínculo:', error);
      } finally {
        setCheckingLink(false);
      }
    };

    console.log('🔄 Iniciando polling para verificar vínculo...');
    
    // Verificar cada 3 segundos
    const interval = setInterval(() => {
      console.log('🔄 Verificando si el código fue usado...');
      checkLinkStatus();
    }, 3000);
    
    // Verificar inmediatamente también
    checkLinkStatus();

    return () => {
      console.log('🛑 Deteniendo polling');
      clearInterval(interval);
    };
  }, [user?.userId, linkCode, router]);

  const copyToClipboard = () => {
    if (linkCode) {
      Clipboard.setString(linkCode.code);
      setSuccessMessage("Código copiado al portapapeles");
      setShowSuccess(true);
    }
  };

  const shareCode = async () => {
    if (linkCode) {
      try {
        await Share.share({
          message: `¡Únete a mí en Nexus! Mi código es: ${linkCode.code}\n\nEl código expira en ${linkCode.validityMinutes} minutos.`,
        });
      } catch (error) {
        console.error("Error al compartir:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Mi código de vínculo" onBack={() => router.back()} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Generando código...</Text>
        </View>
      ) : linkCode ? (
        <View style={styles.content}>
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Comparte este código con tu pareja para conectar sus cuentas
          </Text>

          {/* QR Code */}
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 200, type: "spring", damping: 15 }}
            style={styles.qrContainer}
          >
            <View style={styles.qrGradient}>
              <QRCode
                value={linkCode.code}
                size={200}
                color={palette.primary}
                backgroundColor="transparent"
                logoSize={40}
                logoMargin={8}
                logoBorderRadius={8}
                quietZone={10}
                enableLinearGradient={true}
                linearGradient={[...gradients.primary]}
                ecl="H"
              />
            </View>
          </MotiView>

          {/* Code display */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 400 }}
            style={styles.codeCard}
          >
            <Text style={styles.codeLabel}>Tu código</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codePrefix}>NEXUS-</Text>
              <Text style={styles.code}>{linkCode.code}</Text>
            </View>
          </MotiView>

          {/* Timer / Regenerate link */}
          {isExpired ? (
            <TouchableOpacity 
              style={styles.regenerateContainer}
              onPress={() => {
                console.log("Botón presionado - generando nuevo código");
                generateLinkCode();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={18} color={palette.primary} />
              <Text style={styles.regenerateText}>Generar nuevo código</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={18} color={palette.textSecondary} />
              <Text style={styles.timer}>Expira en: {timeRemaining}</Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButtonWrapper}
              onPress={copyToClipboard}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Ionicons name="copy-outline" size={20} color={palette.onPrimary} />
                <Text style={styles.primaryButtonText}>Copiar código</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={shareCode}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={20} color={palette.primary} />
              <Text style={styles.secondaryButtonText}>Compartir</Text>
            </TouchableOpacity>
          </View>

          {/* Alternative option */}
          <View style={styles.alternativeContainer}>
            <Text style={styles.alternativeLabel}>¿Tu pareja ya tiene código?</Text>
            <TouchableOpacity onPress={() => router.push("/(link)/enter-link-code")}>
              <Text style={styles.alternativeLink}>Ingresar código de pareja</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Modals */}
      <ErrorModal
        visible={showError}
        message={error}
        onClose={() => setShowError(false)}
      />
      <SuccessModal
        visible={showSuccess}
        message={successMessage}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: palette.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  qrContainer: {
    marginBottom: 24,
  },
  qrGradient: {
    width: 240,
    height: 240,
    borderRadius: 32,
    backgroundColor: palette.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  codeCard: {
    width: "100%",
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.primaryBorder,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 8,
    textAlign: "center",
  },
  codeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  codePrefix: {
    fontSize: 32,
    color: palette.textAccent,
    fontWeight: "400",
    letterSpacing: 0,
  },
  code: {
    fontSize: 32,
    color: palette.textAccent,
    fontWeight: "400",
    letterSpacing: 2,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 24,
  },
  timer: {
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: "400",
  },
  regenerateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 24,
    paddingVertical: 8,
  },
  regenerateText: {
    fontSize: 13,
    color: palette.textAccent,
    fontWeight: "600",
  },
  actions: {
    width: "100%",
    gap: 10,
    marginBottom: 24,
  },
  primaryButtonWrapper: {
    borderRadius: 28,
    overflow: "hidden",
  },
  primaryButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: palette.onPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.primary,
    borderRadius: 28,
  },
  secondaryButtonText: {
    color: palette.textAccent,
    fontSize: 15,
    fontWeight: "600",
  },
  alternativeContainer: {
    alignItems: "center",
    marginTop: 8,
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
});
