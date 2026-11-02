import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { processProfilePhoto } from '@/utils/imageProcessor';
import { birthDateLabel } from '@/utils/profileFormat';
import { toBackendDate } from '@/utils/registerForm';
import { WebDateInput } from '@/components/ui/WebDateInput';
import { LinearGradient } from "expo-linear-gradient";
import { Card, ListCard, ListRow, TabTitle } from "../../components/ui/Surface";
import { GradientButton } from "../components/ui/GradientButton";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { ActionModal } from "../components/ActionModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { profileService } from "../../services/profile.service";
import { useAuth } from "../../context/AuthContext";
import type { UpdateProfileRequest } from "../../types/auth.types";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import { palette, gradients } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  useQuestionnaireGuard();
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  
  // Estados del perfil (inicializados con datos del usuario o valores por defecto)
  const [displayName, setDisplayName] = useState(user?.displayName || "Usuario de Prueba");
  const [nickname, setNickname] = useState(user?.nickname || "usuario_prueba");
  const [email, setEmail] = useState(user?.email || "usuario@prueba.com");
  const [birthDate, setBirthDate] = useState<string>("2000-01-01");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  
  // Actualizar estados cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setNickname(user.nickname || "");
      setEmail(user.email);
      // La foto exige sesion: se pide por apiClient (sin foto queda null)
      profileService.fetchAvatar(user.userId).then(setAvatarUri);
    }
  }, [user]);
  
  // Estados de edición temporal
  const [editDisplayName, setEditDisplayName] = useState(displayName);
  const [editNickname, setEditNickname] = useState(nickname);
  const [editEmail, setEditEmail] = useState(email);
  const [editBirthDate, setEditBirthDate] = useState(birthDate);
  
  // Estados UI
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });
  const [successModal, setSuccessModal] = useState({ visible: false, message: "" });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [newEmailForVerify, setNewEmailForVerify] = useState('');

  // Validación de email (RN-24)
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Manejar cambio de fecha desde el DatePicker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // En iOS se mantiene visible
    
    if (selectedDate) {
      // Formatear fecha a YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setEditBirthDate(formattedDate);
    }
  };

  // Eliminar foto de perfil
  const handleRemoveAvatar = async () => {
    if (!user) {
      setErrorModal({
        visible: true,
        message: "No hay sesión activa",
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const response = await profileService.deleteAvatar(user.userId);
      
      if (response.error) {
        setErrorModal({
          visible: true,
          message: response.error.message || "Error al eliminar la imagen",
        });
      } else {
        setAvatarUri(null);
        setSuccessModal({
          visible: true,
          message: "Foto de perfil eliminada correctamente",
        });
      }
    } catch (error: any) {
      setErrorModal({
        visible: true,
        message: error.message || "Error al eliminar la imagen",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Seleccionar y subir imagen
  const handlePickImage = async () => {
    if (!user) {
      setErrorModal({
        visible: true,
        message: "No hay sesión activa",
      });
      return;
    }

    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setShowPermissionModal(true);
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || !result.assets[0]) {
        setErrorModal({
          visible: true,
          message: "No se pudo cargar la imagen",
        });
        return;
      }

      const asset = result.assets[0];

      setIsUploadingAvatar(true);

      let imageBase64: string;
      try {
        imageBase64 = await processProfilePhoto(asset);
      } catch {
        setErrorModal({
          visible: true,
          message: 'No se pudo procesar la imagen. Por favor elige una diferente.',
        });
        setIsUploadingAvatar(false);
        return;
      }

      console.log('📤 Subiendo avatar...');
      const response = await profileService.updateAvatar(user.userId, imageBase64);

      if (response.error) {
        console.error('❌ Error en respuesta:', response.error);
        setErrorModal({
          visible: true,
          message: response.error.message || "Error al subir la imagen",
        });
      } else {
        console.log('✅ Avatar actualizado');
        // Mostrar la foto recien guardada tal como la devuelve el servidor
        setAvatarUri(await profileService.fetchAvatar(user.userId));
        setSuccessModal({
          visible: true,
          message: "Foto de perfil actualizada correctamente",
        });
      }
    } catch (error: any) {
      console.error('❌ Error al subir imagen:', error);
      setErrorModal({
        visible: true,
        message: error.message || "Error inesperado al subir la imagen",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Iniciar modo edición
  const handleStartEdit = () => {
    setEditDisplayName(displayName);
    setEditNickname(nickname);
    setEditEmail(email);
    setEditBirthDate(birthDate);
    setIsEditing(true);
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditDisplayName(displayName);
    setEditNickname(nickname);
    setEditEmail(email);
    setEditBirthDate(birthDate);
    setIsEditing(false);
  };

  // Guardar cambios
  const handleSaveEdit = async () => {
    // FA01: Validar que los campos no estén vacíos
    if (!editDisplayName.trim()) {
      setErrorModal({
        visible: true,
        message: "El nombre completo es obligatorio",
      });
      return;
    }

    if (editDisplayName.trim().length < 2) {
      setErrorModal({
        visible: true,
        message: "El nombre debe tener al menos 2 caracteres",
      });
      return;
    }

    // Validar formato de fecha de nacimiento
    if (!editBirthDate || !/^\d{4}-\d{2}-\d{2}$/.test(editBirthDate)) {
      setErrorModal({
        visible: true,
        message: "La fecha de nacimiento debe tener el formato YYYY-MM-DD",
      });
      return;
    }

    // RN-01: Validar mayoría de edad (18 años)
    const birthDateObj = new Date(editBirthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    if (age < 18) {
      setErrorModal({
        visible: true,
        message: "Debes ser mayor de edad (18 años o más) para usar esta aplicación",
      });
      return;
    }

    // FA02: Validar formato de email (RN-24)
    if (!validateEmail(editEmail.trim())) {
      setErrorModal({
        visible: true,
        message: "El formato del correo electrónico no es válido",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!user) {
        setErrorModal({
          visible: true,
          message: "No hay sesión activa",
        });
        return;
      }

      const request: UpdateProfileRequest = {
        displayName: editDisplayName.trim(),
        nickname: editNickname.trim() || undefined,
        email: editEmail.trim(),
        birthDate: editBirthDate,
      };

      const result = await profileService.updateProfile(user.userId, request);

      if (result.error) {
        // Error de mayoría de edad
        if (result.error.message?.includes("mayor de edad")) {
          setErrorModal({
            visible: true,
            message: "Debes ser mayor de edad (18 años o más) para usar esta aplicación",
          });
        }
        // FA03: Email ya registrado (RN-25)
        else if (result.error.message?.includes("ya está registrado")) {
          setErrorModal({
            visible: true,
            message: "El correo electrónico ya está registrado por otro usuario",
          });
        } else {
          // FA04: Error general
          setErrorModal({
            visible: true,
            message: result.error.message || "Error al actualizar el perfil",
          });
        }
      } else {
        // Actualizar estado local
        setDisplayName(result.data!.displayName);
        setNickname(result.data!.nickname || "");
        setEmail(result.data!.email);
        setBirthDate(editBirthDate);
        
        // Actualizar contexto global
        await updateUser({
          displayName: result.data!.displayName,
          nickname: result.data!.nickname,
          email: result.data!.email,
          emailConfirmed: result.data!.emailConfirmed,
        });
        
        setIsEditing(false);
        
        // Mostrar mensaje de éxito
        setSuccessModal({
          visible: true,
          message: result.data!.message,
        });
        
        // RN-05: Si cambió el email, mostrar información adicional
        if (result.data!.emailChanged) {
          setTimeout(() => {
            setNewEmailForVerify(result.data!.email);
            setShowEmailVerifyModal(true);
          }, 1500);
        }
      }
    } catch (error) {
      // FA04: Error inesperado
      setErrorModal({
        visible: true,
        message: "Ocurrió un error inesperado. Por favor intenta más tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  type IconName = keyof typeof Ionicons.glyphMap;

  /** Fila de dato del perfil: en lectura muestra el valor; en edicion, el campo. */
  const infoRow = (icon: IconName, label: string, value: string, editor: React.ReactNode) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={palette.icon} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        {isEditing ? editor : <Text style={styles.infoValue}>{value}</Text>}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TabTitle
          right={
            isEditing ? (
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={styles.iconButton}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar edición"
                  disabled={isLoading}
                >
                  <Ionicons name="close" size={20} color={palette.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  style={[styles.iconButton, styles.saveIconButton]}
                  accessibilityRole="button"
                  accessibilityLabel="Guardar cambios"
                  disabled={isLoading}
                >
                  <Ionicons name="checkmark" size={20} color={palette.textAccent} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleStartEdit} style={styles.editButton} disabled={isLoading} accessibilityRole="button">
                <Ionicons name="pencil-outline" size={16} color={palette.textAccent} />
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            )
          }
        >
          Mi perfil
        </TabTitle>

        <View style={styles.who}>
          <View>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} onError={() => setAvatarUri(null)} />
              ) : (
                <Text style={styles.avatarInitial}>{(displayName || "U").charAt(0).toUpperCase()}</Text>
              )}
            </LinearGradient>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
              hitSlop={10}
              style={styles.cameraButton}
              onPress={() => (avatarUri ? setShowAvatarModal(true) : handlePickImage())}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color={palette.textAccent} />
              ) : (
                <Ionicons name="camera-outline" size={18} color={palette.textAccent} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {nickname ? <Text style={styles.nick}>{nickname}</Text> : null}
        </View>

        <Card style={styles.infoCard}>
          {infoRow(
            "person-outline",
            "Nombre completo",
            displayName,
            <TextInput
              value={editDisplayName}
              onChangeText={setEditDisplayName}
              style={styles.input}
              placeholder="Ingresa tu nombre"
              placeholderTextColor={palette.textMuted}
              editable={!isLoading}
            />,
          )}
          <View style={styles.divider} />
          {infoRow(
            "pricetag-outline",
            "Apodo",
            nickname || "Sin apodo",
            <TextInput
              value={editNickname}
              onChangeText={setEditNickname}
              style={styles.input}
              placeholder="Ingresa tu apodo"
              placeholderTextColor={palette.textMuted}
              editable={!isLoading}
            />,
          )}
          <View style={styles.divider} />
          {infoRow(
            "mail-outline",
            "Correo electrónico",
            email,
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor={palette.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />,
          )}
          <View style={styles.divider} />
          {infoRow(
            "calendar-outline",
            "Fecha de nacimiento",
            birthDateLabel(birthDate),
            Platform.OS === "web" ? (
              <WebDateInput
                value={editBirthDate}
                onChange={(iso) => iso && setEditBirthDate(iso)}
                min="1900-01-01"
                max={toBackendDate(new Date())}
                disabled={isLoading}
                accessibilityLabel="Fecha de nacimiento"
              />
            ) : (
              <TouchableOpacity accessibilityRole="button" style={styles.dateInput} onPress={() => setShowDatePicker(true)} disabled={isLoading}>
                <Text style={styles.inputText}>{birthDateLabel(editBirthDate)}</Text>
                <Ionicons name="chevron-down" size={18} color={palette.icon} />
              </TouchableOpacity>
            ),
          )}
          {isEditing && <Text style={styles.fieldHint}>Debes ser mayor de 18 años.</Text>}
          {isEditing && showDatePicker && Platform.OS !== "web" && (
            <DateTimePicker
              value={editBirthDate ? new Date(editBirthDate) : new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              accentColor={palette.primary}
              textColor={palette.text}
            />
          )}
        </Card>

        {isEditing ? (
          <GradientButton title="Guardar cambios" onPress={handleSaveEdit} loading={isLoading} />
        ) : (
          <ListCard>
            <ListRow
              icon="heart-outline"
              title="Mis preferencias"
              subtitle="Tus gustos en las 7 dimensiones"
              onPress={() => router.push("/(tabs)/preferences")}
            />
            <ListRow
              icon="happy-outline"
              title="Mi ánimo"
              subtitle="Cómo te has sentido estos días"
              onPress={() => router.push("/(mood)/mood-history")}
            />
            <ListRow
              icon="key-outline"
              title="Cambiar contraseña"
              subtitle="Te enviamos un código a tu correo"
              onPress={() => router.push({ pathname: "/(auth)/forgot-password", params: { email } })}
            />
            <ListRow
              icon="settings-outline"
              title="Configuraciones"
              subtitle="Horarios, calendarios y cuenta"
              onPress={() => router.push("/(tabs)/configuraciones")}
            />
          </ListCard>
        )}
      </ScrollView>


      {/* Modales */}
      <ActionModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        title="Foto de perfil"
        actions={[
          {
            label: "Cambiar foto",
            icon: "images-outline",
            onPress: handlePickImage,
          },
          {
            label: "Eliminar foto",
            icon: "trash-outline",
            destructive: true,
            onPress: handleRemoveAvatar,
          },
        ]}
      />

      <ErrorModal
        visible={errorModal.visible}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, message: "" })}
      />

      <SuccessModal
        visible={successModal.visible}
        message={successModal.message}
        onClose={() => setSuccessModal({ visible: false, message: "" })}
      />

      {/* Modal de permisos */}
      <ConfirmModal
        visible={showPermissionModal}
        type="info"
        title="Permisos necesarios"
        message="Se requieren permisos para acceder a la galería de fotos"
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setShowPermissionModal(false)}
      />

      {/* Modal de verificación de email */}
      <ConfirmModal
        visible={showEmailVerifyModal}
        type="info"
        title="Verifica tu nuevo correo"
        message="Se ha enviado un código de verificación a tu nuevo correo electrónico. Por favor verifícalo para continuar usando tu cuenta."
        confirmText="Verificar ahora"
        cancelText="Después"
        onConfirm={() => {
          setShowEmailVerifyModal(false);
          router.push({
            pathname: "/(auth)/verify-email",
            params: { email: newEmailForVerify }
          });
        }}
        onCancel={() => setShowEmailVerifyModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 20 },
  editActions: { flexDirection: "row", gap: 8 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: palette.secondarySoft,
  },
  editButtonText: { fontSize: 13, fontWeight: "500", color: palette.textAccent },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  saveIconButton: { backgroundColor: palette.secondarySoft },
  who: { alignItems: "center", gap: 8 },
  avatar: { width: 104, height: 104, borderRadius: 52, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImage: { width: 104, height: 104 },
  avatarInitial: { fontSize: 36, fontWeight: "700", color: palette.onPrimary },
  cameraButton: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 20, fontWeight: "600", color: palette.text },
  nick: { fontSize: 12, color: palette.textSecondary },
  infoCard: { gap: 0 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoText: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 12, color: palette.textMuted },
  infoValue: { fontSize: 14, color: palette.text },
  divider: { height: 1, backgroundColor: palette.divider, marginVertical: 12 },
  input: {
    fontSize: 14,
    color: palette.text,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
  },
  inputText: { fontSize: 14, color: palette.text },
  fieldHint: { marginTop: 8, fontSize: 12, color: palette.textMuted },
});
