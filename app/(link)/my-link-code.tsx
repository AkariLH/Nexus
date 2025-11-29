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
import { API_CONFIG } from "../../config/api.config";

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
      const response = await fetch(`${API_CONFIG.BASE_URL}/link/generate/${user.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al generar el código");
      }

      const data: LinkCodeData = await response.json();
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
        const response = await fetch(`${API_CONFIG.BASE_URL}/link/status/${user.userId}`);
        
        if (response.ok) {
          const data = await response.json();
          
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Mi código de vínculo</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4F81" />
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
                color="#FF4F81"
                backgroundColor="transparent"
                logoSize={40}
                logoMargin={8}
                logoBorderRadius={8}
                quietZone={10}
                enableLinearGradient={true}
                linearGradient={["#FF4F81", "#8A2BE2"]}
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
              <Ionicons name="refresh-outline" size={18} color="#FF4F81" />
              <Text style={styles.regenerateText}>Generar nuevo código</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={18} color="#666" />
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
                colors={["#FF4F81", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Ionicons name="copy-outline" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Copiar código</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={shareCode}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={20} color="#FF4F81" />
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
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: "400",
    color: "#1A1A1A",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#1A1A1A99",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
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
    backgroundColor: "#ffe8f0bb",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  codeCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#FFD0E0",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 14,
    color: "#666",
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
    color: "#FF4F81",
    fontWeight: "400",
    letterSpacing: 0,
  },
  code: {
    fontSize: 32,
    color: "#FF4F81",
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
    color: "#666",
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
    color: "#FF4F81",
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
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#FF4F81",
    borderRadius: 28,
  },
  secondaryButtonText: {
    color: "#FF4F81",
    fontSize: 15,
    fontWeight: "600",
  },
  alternativeContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  alternativeLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  alternativeLink: {
    fontSize: 14,
    color: "#FF4F81",
    fontWeight: "500",
  },
});
