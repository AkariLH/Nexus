import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  email: string;
  displayName: string;
}

export function SuccessModal({ visible, onClose, email, displayName }: SuccessModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={["#FF4F81", "#8A2BE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalIconWrapper}
          >
            <Ionicons name="checkmark-circle" size={48} color="#FFF" />
          </LinearGradient>

          <Text style={styles.modalTitle}>¡Cuenta creada exitosamente!</Text>

          <Text style={styles.modalMessage}>
            Hemos enviado un código de verificación a tu correo electrónico
          </Text>

          {/* Email card */}
          <View style={styles.emailCard}>
            <View style={styles.emailRow}>
              <LinearGradient
                colors={["#FF4F81", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emailIconWrapper}
              >
                <Ionicons name="mail" size={20} color="#FFF" />
              </LinearGradient>
              <View style={styles.emailInfo}>
                <Text style={styles.emailLabel}>Enviado a</Text>
                <Text style={styles.emailText} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            </View>

            {/* Timer info */}
            <View style={styles.timerDivider} />
            <View style={styles.timerRow}>
              <Ionicons name="time" size={16} color="#FF4F81" />
              <Text style={styles.timerText}>
                El código expira en <Text style={styles.timerHighlight}>1 hora</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.modalButtonWrapper}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#FF4F81", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Verificar ahora</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Helper text */}
          <Text style={styles.helperText}>Revisa tu bandeja de entrada y spam</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#1A1A1A",
    opacity: 0.6,
    marginBottom: 24,
    textAlign: "center",
  },
  emailCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "#FF4F8110",
    shadowColor: "#FF4F81",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  emailIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emailInfo: {
    flex: 1,
    minWidth: 0,
  },
  emailLabel: {
    fontSize: 12,
    color: "#1A1A1A",
    opacity: 0.5,
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  timerDivider: {
    height: 1,
    backgroundColor: "#1A1A1A",
    opacity: 0.1,
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerText: {
    fontSize: 13,
    color: "#1A1A1A",
    opacity: 0.6,
  },
  timerHighlight: {
    color: "#FF4F81",
    fontWeight: "600",
  },
  modalButtonWrapper: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: "#1A1A1A",
    opacity: 0.4,
    textAlign: "center",
    marginTop: 16,
  },
});
