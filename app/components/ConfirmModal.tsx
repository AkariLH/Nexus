import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  isDanger?: boolean;
}

export function ConfirmModal({ 
  visible, 
  onConfirm, 
  onCancel,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  iconName = "alert-circle",
  isDanger = false
}: ConfirmModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[
            styles.modalIconWrapper,
            isDanger && styles.dangerIconWrapper
          ]}>
            <Ionicons 
              name={iconName} 
              size={48} 
              color={isDanger ? "#EF4444" : "#FF4F81"} 
            />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>

          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButtonWrapper}
              onPress={onConfirm}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isDanger ? ["#EF4444", "#DC2626"] : ["#FF4F81", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "#FFF5F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  dangerIconWrapper: {
    backgroundColor: "#FEE2E2",
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
    opacity: 0.7,
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#F7F7F7",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#1A1A1A",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButtonWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  confirmButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
