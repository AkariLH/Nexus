import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ErrorModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  actionButton?: {
    text: string;
    onPress: () => void;
  };
}

export function ErrorModal({ visible, onClose, title = "Error", message, actionButton }: ErrorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Ícono de error */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={["#FF4F81", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons name="alert-circle" size={48} color="#FFF" />
            </LinearGradient>
          </View>

          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Mensaje */}
          <Text style={styles.message}>{message}</Text>

          {/* Botón de acción (si existe) */}
          {actionButton && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.buttonWrapper, styles.actionButtonWrapper]}
              onPress={actionButton.onPress}
            >
              <LinearGradient
                colors={["#FF4F81", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{actionButton.text}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Botón Cerrar */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.buttonWrapper, actionButton && styles.secondaryButtonWrapper]}
            onPress={onClose}
          >
            {actionButton ? (
              <View style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cerrar</Text>
              </View>
            ) : (
              <LinearGradient
                colors={["#FF4F81", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Entendido</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#1A1A1A",
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonWrapper: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  button: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  actionButtonWrapper: {
    marginBottom: 12,
  },
  secondaryButtonWrapper: {
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 24,
  },
  secondaryButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
});
