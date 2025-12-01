import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Modal, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  ActivityIndicator 
} from "react-native";
import { BlurView } from "expo-blur";

type ModalType = "confirm" | "success" | "error" | "info";

interface ConfirmModalProps {
  visible: boolean;
  type?: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  showCancel?: boolean;
}

export function ConfirmModal({
  visible,
  type = "confirm",
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  loading = false,
  showCancel = true,
}: ConfirmModalProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle" as const, color: "#10B981" };
      case "error":
        return { name: "close-circle" as const, color: "#EF4444" };
      case "info":
        return { name: "information-circle" as const, color: "#3B82F6" };
      default:
        return { name: "help-circle" as const, color: "#F59E0B" };
    }
  };

  const icon = getIcon();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Icono */}
            <LinearGradient
              colors={["#FF4F81", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Ionicons name={icon.name} size={48} color="#FFFFFF" />
            </LinearGradient>

            {/* Título */}
            <Text style={styles.modalTitle}>{title}</Text>

            {/* Mensaje */}
            <Text style={styles.modalMessage}>{message}</Text>

            {/* Botones */}
            <View style={styles.buttonContainer}>
              {showCancel && onCancel && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}

              {onConfirm && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={onConfirm}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      type === "error"
                        ? ["#EF4444", "#DC2626"]
                        : type === "success"
                        ? ["#10B981", "#059669"]
                        : ["#FF4F81", "#8A2BE2"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.confirmButtonText}>{confirmText}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: "#FFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalContent: {
    padding: 32,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    overflow: "hidden",
  },
  confirmButtonGradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
