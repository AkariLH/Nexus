import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import { 
  Modal, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  ActivityIndicator 
} from "react-native";

interface PasswordConfirmModalProps {
  visible: boolean;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
  onError?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function PasswordConfirmModal({ 
  visible, 
  onConfirm, 
  onCancel,
  onError,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("La contraseña es requerida");
      return;
    }
    
    setError("");
    await onConfirm(password);
  };

  const handleCancel = () => {
    setPassword("");
    setShowPassword(false);
    setError("");
    onCancel();
  };

  // Limpiar contraseña solo cuando el modal se cierra completamente
  useEffect(() => {
    if (!visible) {
      setPassword("");
      setShowPassword(false);
      setError("");
    }
  }, [visible]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.dangerIconWrapper}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#EF4444" />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          {/* Campo de contraseña */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={error ? "#EF4444" : "#1A1A1A66"}
              style={styles.iconLeft}
            />
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError("");
              }}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#1A1A1A66"
              secureTextEntry={!showPassword}
              style={[styles.input, error && styles.inputError]}
              editable={!isLoading}
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.iconRight}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#1A1A1A66"
              />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButtonWrapper}
              onPress={handleConfirm}
              activeOpacity={0.9}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#EF4444", "#DC2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                )}
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
  dangerIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
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
    opacity: 0.7,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    height: 56,
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 8,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF5F7",
  },
  iconLeft: {
    position: "absolute",
    left: 16,
  },
  iconRight: {
    position: "absolute",
    right: 16,
  },
  input: {
    height: "100%",
    paddingLeft: 48,
    paddingRight: 48,
    fontSize: 16,
    color: "#1A1A1A",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
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
