import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { ListCard, ListRow, SectionLabel } from "../../components/ui/Surface";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { PasswordConfirmModal } from "../components/PasswordConfirmModal";
import { profileService } from "../../services/profile.service";
import { useAuth } from "../../context/AuthContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import { palette } from "../../constants/colors";

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
      <ScreenHeader title="Configuraciones" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <SectionLabel muted>Disponibilidad</SectionLabel>
        <ListCard>
          <ListRow
            icon="time-outline"
            title="Horarios permitidos"
            subtitle="Cuándo puede Nexus sugerirles planes"
            onPress={() => router.push("/(settings)/availability-schedule")}
            disabled={isLoading}
          />
          <ListRow
            icon="calendar-outline"
            title="Calendarios externos"
            subtitle="Vincula el calendario de tu teléfono"
            onPress={() => router.push("/(tabs)/link-external-calendars")}
            disabled={isLoading}
          />
        </ListCard>

        <SectionLabel muted>Cuenta</SectionLabel>
        <ListCard>
          <ListRow
            icon="log-out-outline"
            title="Cerrar sesión"
            onPress={() => setShowLogoutConfirm(true)}
            disabled={isLoading}
            trailing={isLoading ? <ActivityIndicator size="small" color={palette.primary} /> : undefined}
          />
        </ListCard>
        <ListCard>
          <ListRow
            icon="trash-outline"
            title="Eliminar cuenta"
            subtitle="Esta acción es permanente"
            danger
            onPress={handleDeleteAccount}
            disabled={isLoading}
          />
        </ListCard>
      </ScrollView>


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
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
});
