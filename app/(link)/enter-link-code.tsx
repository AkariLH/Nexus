import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";

export default function EnterLinkCodeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConnect = async () => {
    if (!user?.userId) return;
    
    // Remover el prefijo NEXUS- para obtener solo el código
    const cleanCode = code.replace(/^NEXUS-/i, "").trim();
    
    if (!cleanCode || cleanCode.length < 6) {
      setError("Por favor ingresa un código válido");
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://192.168.1.95:8080/api/link/establish/${user.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: cleanCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al establecer el vínculo");
      }

      const data = await response.json();
      console.log("Vínculo establecido:", data);
      
      // Obtener el nombre de la pareja del response
      const partnerName = data.partner?.displayName || data.partner?.nickname || "tu pareja";
      
      // Navegar directamente a la pantalla de éxito con el nombre de la pareja
      router.replace({
        pathname: "/(link)/link-success",
        params: { partnerName }
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Ingresar código</Text>
      </View>

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
            colors={["#FF4F8120", "#8A2BE220"]}
            style={styles.iconGradient}
          >
            <Ionicons name="link" size={48} color="#FF4F81" />
          </LinearGradient>
        </View>

        <Text style={styles.heading}>Conecta con tu pareja</Text>
        <Text style={styles.subtitle}>
          Ingresa el código único que tu pareja te compartió
        </Text>

        {/* Code input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Código de vínculo</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>NEXUS  - </Text>
            <TextInput
              value={code}
              onChangeText={(text) => {
                // Solo permitir caracteres alfanuméricos y convertir a mayúsculas
                const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
                // Limitar a 6 caracteres
                setCode(cleaned.substring(0, 6));
              }}
              placeholder="XXXXXX"
              placeholderTextColor="#1A1A1A40"
              style={styles.inputField}
              maxLength={6}
              autoCapitalize="characters"
              editable={!loading}
            />
          </View>
        </View>

        {/* Connect button */}
        <TouchableOpacity
          style={[styles.connectButtonWrapper, (!code || code.length < 6 || loading) && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={!code || code.length < 6 || loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#FF4F81", "#8A2BE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.connectButton}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.connectButtonText}>Conectar</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Alternative option */}
        <View style={styles.alternativeContainer}>
          <Text style={styles.alternativeLabel}>¿No tienes el código aún?</Text>
          <TouchableOpacity onPress={() => router.push("/(link)/my-link-code")}>
            <Text style={styles.alternativeLink}>Comparte el tuyo primero</Text>
          </TouchableOpacity>
        </View>

        {/* Help text */}
        <View style={styles.helpBox}>
          <Text style={styles.helpText}>
            💡 Pídele a tu pareja que vaya a "Vínculo" → "Ver mi código" para obtener su código único
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
        message="¡Vínculo establecido exitosamente!"
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
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
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
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
    color: "#1A1A1A",
    marginBottom: 8,
  },
  inputWrapper: {
    width: "100%",
    height: 56,
    backgroundColor: "#F5F5F5",
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
    color: "#999",
    marginRight: 0,
    letterSpacing: 4,
  },
  inputField: {
    flex: 0,
    width: 120,
    height: 56,
    color: "#1A1A1A",
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
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  alternativeContainer: {
    alignItems: "center",
    marginBottom: 32,
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
  helpBox: {
    marginTop: "auto",
    marginBottom: 32,
    backgroundColor: "#8A2BE210",
    borderRadius: 20,
    padding: 16,
  },
  helpText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
