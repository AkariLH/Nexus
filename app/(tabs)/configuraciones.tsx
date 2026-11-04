import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { ListCard, ListRow, SectionLabel } from "../../components/ui/Surface";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { PasswordConfirmModal } from "../components/PasswordConfirmModal";
import { profileService } from "../../services/profile.service";
import linkService from "../../services/link.service";
import { useAuth } from "../../context/AuthContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import { restartTutorial } from "../../hooks/useFirstSteps";
import { TourTarget } from "../../components/onboarding/TourTarget";
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
  // [pulido-critica] D4: "Desvincular" vive aqui (antes al final de Vinculo).
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [unlinkMessage, setUnlinkMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    linkService
      .getLinkStatus(user.userId)
      .then((s) =>
        setPartnerName(s.hasActiveLink ? s.partner?.displayName || s.partner?.nickname || "tu pareja" : null),
      )
      .catch(() => setPartnerName(null));
  }, [user?.userId]);

  const confirmUnlink = async () => {
    if (!user?.userId) return;

    setShowUnlinkConfirm(false);
    setIsUnlinking(true);

    try {
      const response = await linkService.deleteLink(user.userId);

      if (response.success) {
        const name = response.partnerName || partnerName || "tu pareja";
        let message = `Te has desvinculado de ${name}`;

        // Agregar nota si la notificación no se envió
        if (!response.notificationSent) {
          message += `.\n\nNota: ${name} verá el cambio cuando abra o recargue la app.`;
        }

        setPartnerName(null);
        setUnlinkMessage(message);
      } else {
        setErrorModal({ visible: true, message: response.message || "No se pudo eliminar el vínculo" });
      }
    } catch (error: any) {
      console.error("Error al desvincular:", error);
      setErrorModal({ visible: true, message: error.message || "No se pudo desvincular. Inténtalo de nuevo." });
    } finally {
      setIsUnlinking(false);
    }
  };

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
        message: "Cerraste sesión." 
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
        message: "No se pudo cerrar sesión. Inténtalo de nuevo."
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
        message: "Tu sesión venció. Inicia sesión otra vez."
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
          message: result.error.message || "La contraseña no coincide. Inténtalo de nuevo."
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
        message: result.data?.message || "Eliminamos tu cuenta."
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
        message: error.message || "No se pudo eliminar la cuenta. Inténtalo en unos minutos."
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Configuraciones" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <SectionLabel muted>Disponibilidad</SectionLabel>
        <ListCard>
          <TourTarget id="settings.schedule">
            <ListRow
              icon="time-outline"
              title="Horarios permitidos"
              subtitle="Cuándo puede Nexus sugerirles planes"
              onPress={() => router.push("/(settings)/availability-schedule")}
              disabled={isLoading}
            />
          </TourTarget>
          <TourTarget id="settings.calendars">
            <ListRow
              icon="calendar-outline"
              title="Calendarios externos"
              subtitle="Vincula el calendario de tu teléfono"
              onPress={() => router.push("/(tabs)/link-external-calendars")}
              disabled={isLoading}
            />
          </TourTarget>
        </ListCard>

        {/* [primeros-pasos] U7 */}
        <SectionLabel muted>Ayuda</SectionLabel>
        <ListCard>
          <ListRow
            icon="school-outline"
            title="Ver tutorial"
            subtitle="Vuelven los primeros pasos y las guías"
            onPress={async () => {
              if (!user?.userId) return;
              await restartTutorial(user.userId);
              router.navigate("/(tabs)");
            }}
            disabled={isLoading}
          />
        </ListCard>

        <SectionLabel muted>Cuenta</SectionLabel>
        <ListCard>
          {/* Antes en Perfil; vive aquí, con el resto de la cuenta. */}
          <ListRow
            icon="key-outline"
            title="Cambiar contraseña"
            subtitle="Te enviamos un código a tu correo"
            onPress={() => router.push({ pathname: "/(auth)/forgot-password", params: { email: user?.email ?? "" } })}
            disabled={isLoading}
          />
          <ListRow
            icon="log-out-outline"
            title="Cerrar sesión"
            onPress={() => setShowLogoutConfirm(true)}
            disabled={isLoading}
            trailing={isLoading ? <ActivityIndicator size="small" color={palette.primary} /> : undefined}
          />
        </ListCard>

        {/* [pulido-critica] D4 (Figma M4): lo que no se puede deshacer va junto y al final. */}
        <SectionLabel muted>Zona delicada</SectionLabel>
        {partnerName && (
          <ListCard>
            <ListRow
              icon="unlink-outline"
              title="Desvincular"
              subtitle={`Termina el vínculo con ${partnerName}`}
              danger
              onPress={() => setShowUnlinkConfirm(true)}
              disabled={isLoading || isUnlinking}
              trailing={isUnlinking ? <ActivityIndicator size="small" color={palette.error} /> : undefined}
            />
          </ListCard>
        )}
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
        message="Borraremos tu cuenta y todos tus datos. No podrás recuperarlos."
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

      {/* Figma M4b: dice lo que pasa (RN-11 borra los eventos de los dos; RN-12 avisa a la pareja). */}
      <ConfirmModal
        visible={showUnlinkConfirm}
        type="error"
        title={`¿Desvincular de ${partnerName}?`}
        message={`Se borran los eventos que tienen juntos y ${partnerName} recibe un aviso. No se puede deshacer.`}
        confirmText="Desvincular"
        cancelText="Cancelar"
        onConfirm={confirmUnlink}
        onCancel={() => setShowUnlinkConfirm(false)}
      />

      <SuccessModal
        visible={!!unlinkMessage}
        message={unlinkMessage ?? ""}
        onClose={() => {
          setUnlinkMessage(null);
          router.replace("/(tabs)/link");
        }}
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
