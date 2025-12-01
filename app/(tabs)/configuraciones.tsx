import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Header } from "../components/layout/Header";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { PasswordConfirmModal } from "../components/PasswordConfirmModal";
import { profileService } from "../../services/profile.service";
import { useAuth } from "../../context/AuthContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";

export default function ConfiguracionesScreen() {
  useQuestionnaireGuard();
  const router = useRouter();
  const { user, logout: logoutContext } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });
  const [successModal, setSuccessModal] = useState({ visible: false, message: "" });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // CU06 - Cerrar sesión
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Usar el logout del contexto que ya limpia todo
      await logoutContext();
      
      setIsLoading(false);
      
      // Mostrar mensaje de éxito
      setSuccessModal({ 
        visible: true, 
        message: "Sesión cerrada correctamente" 
      });
      
      // Redirigir a la pantalla de login después de cerrar el modal
      setTimeout(() => {
        setSuccessModal({ visible: false, message: "" });
        router.replace("/(auth)/login");
      }, 1500);
      
    } catch (error) {
      // FA01 - Error al cerrar sesión
      setIsLoading(false);
      setErrorModal({
        visible: true,
        message: "No fue posible cerrar sesión. Por favor, intenta nuevamente."
      });
    }
  };

  // Función para eliminar cuenta (próxima implementación)
  const handleDeleteAccount = () => {
    // Primera confirmación (RN-06)
    setShowDeleteConfirm(true);
  };

  // CU07 - Eliminar cuenta con validación de contraseña
  const handleConfirmDelete = async (password: string) => {
    if (!user) {
      setErrorModal({
        visible: true,
        message: "No se pudo identificar al usuario. Por favor, inicia sesión nuevamente."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Segunda confirmación: validar contraseña y eliminar cuenta (RN-06, RN-07)
      const result = await profileService.deleteAccount(user.userId, password);
      
      if (result.error) {
        // FA02 - Contraseña incorrecta - mantener modal abierto
        setIsLoading(false);
        setErrorModal({
          visible: true,
          message: result.error.message || "La contraseña es incorrecta. Por favor, intenta nuevamente."
        });
        return;
      }
      
      // Usar el logout del contexto para limpiar todo
      await logoutContext();
      
      setIsLoading(false);
      setShowPasswordConfirm(false);
      
      // Mostrar mensaje de éxito
      setSuccessModal({
        visible: true,
        message: result.data?.message || "Tu cuenta ha sido eliminada permanentemente"
      });
      
      // Redirigir a login después de 2 segundos
      setTimeout(() => {
        setSuccessModal({ visible: false, message: "" });
        router.replace("/(auth)/login");
      }, 2000);
      
    } catch (error: any) {
      // FA04 - Error del sistema
      setIsLoading(false);
      setShowPasswordConfirm(false);
      setErrorModal({
        visible: true,
        message: error.message || "No se pudo eliminar la cuenta. Por favor, intenta nuevamente más tarde."
      });
    }
  };

  return (
    <View style={styles.container}>
      <Header onBack={() => router.back()} />

      <View style={styles.content}>
        {/* Calendarios Externos */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/link-external-calendars')}
          disabled={isLoading}
        >
          <View style={styles.actionLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={24} color="#1A1A1A" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Calendarios externos</Text>
              <Text style={styles.actionSubtitle}>Vincular Google Calendar</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1A1A1A66" />
        </TouchableOpacity>

        {/* Cerrar sesión */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowLogoutConfirm(true)}
          disabled={isLoading}
        >
          <View style={styles.actionLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="log-out-outline" size={24} color="#1A1A1A" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Cerrar sesión</Text>
              <Text style={styles.actionSubtitle}>Salir de tu cuenta</Text>
            </View>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FF4F81" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#1A1A1A66" />
          )}
        </TouchableOpacity>

        {/* Eliminar cuenta */}
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleDeleteAccount}
          disabled={isLoading}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.iconContainer, styles.dangerIconContainer]}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </View>
            <View>
              <Text style={[styles.actionTitle, styles.dangerText]}>
                Eliminar cuenta
              </Text>
              <Text style={styles.actionSubtitle}>
                Esta acción es permanente
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Modales */}
      {/* Primera confirmación para eliminar cuenta */}
      <ConfirmModal
        visible={showDeleteConfirm}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          setShowPasswordConfirm(true);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="¿Eliminar cuenta?"
        message="Esta acción es irreversible. Todos tus datos serán eliminados permanentemente y no podrán ser recuperados."
        confirmText="Continuar"
        cancelText="Cancelar"
        iconName="warning-outline"
        isDanger={true}
      />

      {/* Segunda confirmación con contraseña */}
      <PasswordConfirmModal
        visible={showPasswordConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowPasswordConfirm(false)}
        title="Confirma tu identidad"
        message="Ingresa tu contraseña para confirmar la eliminación de tu cuenta. Esta acción no se puede deshacer."
        confirmText="Eliminar mi cuenta"
        cancelText="Cancelar"
        isLoading={isLoading}
      />

      <ConfirmModal
        visible={showLogoutConfirm}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        title="Cerrar sesión"
        message="¿Estás seguro que deseas cerrar sesión?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        iconName="log-out-outline"
        isDanger={false}
      />

      <ErrorModal
        visible={errorModal.visible}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, message: "" })}
      />

      <SuccessModal
        visible={successModal.visible}
        message={successModal.message}
        onClose={() => {
          setSuccessModal({ visible: false, message: "" });
          router.replace("/(auth)/login");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  content: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#F7F7F7",
    borderRadius: 20,
    padding: 16,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButton: {
    borderColor: "#FEE2E2",
  },
  dangerIconContainer: {
    backgroundColor: "#FEE2E2",
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  dangerText: {
    color: "#EF4444",
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#1A1A1A99",
  },
});
