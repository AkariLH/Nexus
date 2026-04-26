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
import { Header } from "../components/layout/Header";
import { GradientButton } from "../components/ui/GradientButton";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { ActionModal } from "../components/ActionModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { profileService } from "../../services/profile.service";
import { useAuth } from "../../context/AuthContext";
import type { UpdateProfileRequest } from "../../types/auth.types";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";

export default function PerfilScreen() {
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
      // Intentar cargar avatar si existe, si falla o es null, quedará null
      const avatarUrl = profileService.getAvatarUrl(user.userId);
      setAvatarUri(avatarUrl);
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
        // Actualizar la URI local con timestamp para forzar recarga
        setAvatarUri(`${profileService.getAvatarUrl(user.userId)}?t=${Date.now()}`);
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        {!isEditing ? (
          <TouchableOpacity
            onPress={handleStartEdit}
            style={styles.editButton}
            disabled={isLoading}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              onPress={handleCancelEdit}
              style={styles.iconButton}
              disabled={isLoading}
            >
              <Ionicons name="close" size={20} color="#1A1A1A99" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={[styles.iconButton, styles.saveIconButton]}
              disabled={isLoading}
            >
              <Ionicons name="checkmark" size={20} color="#FF4F81" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Mi perfil</Text>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageWrapper}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.profileImage}
                onError={() => setAvatarUri(null)}
              />
            ) : (
              <Ionicons name="person" size={64} color="#FF4F81" />
            )}
          </View>
          <TouchableOpacity 
            style={styles.cameraButton} 
            onPress={() => {
              if (avatarUri) {
                setShowAvatarModal(true);
              } else {
                handlePickImage();
              }
            }}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <Text style={styles.imageHint}>
            {isUploadingAvatar ? "Subiendo imagen..." : "Toca el ícono para cambiar tu foto"}
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Display Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nombre completo</Text>
            {isEditing ? (
              <View
                style={[
                  styles.inputContainer,
                  styles.inputContainerEditing,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#1A1A1A66"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={editDisplayName}
                  onChangeText={setEditDisplayName}
                  style={styles.input}
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor="#1A1A1A40"
                  editable={!isLoading}
                />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#1A1A1A66"
                  style={styles.inputIcon}
                />
                <Text style={styles.inputText}>{displayName}</Text>
              </View>
            )}
          </View>

          {/* Nickname */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Apodo</Text>
            {isEditing ? (
              <View
                style={[
                  styles.inputContainer,
                  styles.inputContainerEditing,
                ]}
              >
                <Ionicons
                  name="at"
                  size={20}
                  color="#1A1A1A66"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={editNickname}
                  onChangeText={setEditNickname}
                  style={styles.input}
                  placeholder="Ingresa tu apodo"
                  placeholderTextColor="#1A1A1A40"
                  editable={!isLoading}
                />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Ionicons
                  name="at"
                  size={20}
                  color="#1A1A1A66"
                  style={styles.inputIcon}
                />
                <Text style={styles.inputText}>{nickname || "Sin apodo"}</Text>
              </View>
            )}
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Correo electrónico</Text>
            {isEditing ? (
              <View
                style={[
                  styles.inputContainer,
                  styles.inputContainerEditing,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#1A1A1A66"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="#1A1A1A40"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#1A1A1A66"
                  style={styles.inputIcon}
                />
                <Text style={styles.inputText}>{email}</Text>
              </View>
            )}
          </View>

          {/* Fecha de Nacimiento */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.inputContainer,
                    styles.inputContainerEditing,
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#1A1A1A66"
                    style={styles.inputIcon}
                  />
                  <Text style={styles.inputText}>{editBirthDate}</Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#1A1A1A66"
                  />
                </TouchableOpacity>
                <Text style={styles.fieldHint}>
                  Toca para seleccionar la fecha. Debes ser mayor de 18 años.
                </Text>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={editBirthDate ? new Date(editBirthDate) : new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    accentColor="#FF4F81"
                    textColor="#1A1A1A"
                  />
                )}
              </>
            ) : (
              <View style={styles.inputContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#1A1A1A66"
                  style={styles.inputIcon}
                />
                <Text style={styles.inputText}>{birthDate}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Save Button (visible cuando está editando) */}
        {isEditing && (
          <View style={styles.saveButtonContainer}>
            <GradientButton
              title={isLoading ? "Guardando..." : "Guardar cambios"}
              onPress={handleSaveEdit}
              disabled={isLoading}
            />
            {isLoading && (
              <ActivityIndicator
                size="small"
                color="#FF4F81"
                style={styles.loader}
              />
            )}
          </View>
        )}

        {/* Account Actions (solo visible cuando no está editando) */}
        {!isEditing && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/preferences')}
              disabled={isLoading}
            >
              <View>
                <Text style={styles.actionTitle}>Mis preferencias</Text>
                <Text style={styles.actionSubtitle}>
                  Edita tus preferencias de bienestar
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1A1A1A66" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              disabled={isLoading}
            >
              <View>
                <Text style={styles.actionTitle}>Cambiar contraseña</Text>
                <Text style={styles.actionSubtitle}>
                  Actualiza tu contraseña
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1A1A1A66" />
            </TouchableOpacity>
          </View>
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
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editButtonText: {
    color: "#FF4F81",
    fontSize: 16,
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
  },
  saveIconButton: {
    backgroundColor: "#FF4F8120",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 32,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  profileImageWrapper: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(255, 79, 129, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  cameraButton: {
    position: "absolute",
    bottom: 44,
    right: "50%",
    marginRight: -76,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF4F81",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  imageHint: {
    fontSize: 14,
    color: "#1A1A1A99",
    marginTop: 8,
  },
  formContainer: {
    gap: 20,
    marginBottom: 32,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  fieldHint: {
    fontSize: 12,
    color: "#1A1A1A99",
    marginTop: 6,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputContainerEditing: {
    borderColor: "#FF4F81",
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
    padding: 0,
  },
  saveButtonContainer: {
    position: "relative",
    marginBottom: 24,
  },
  loader: {
    position: "absolute",
    right: 20,
    top: 18,
  },
  actionsContainer: {
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
  dangerButton: {
    borderColor: "#FEE2E2",
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
