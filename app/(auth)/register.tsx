import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { authService } from "../../services/auth.service";
import type { RegisterRequest } from "../../types/auth.types";
import { SuccessModal } from "../components/SuccessModal";
import { ErrorModal } from "../components/ErrorModal";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{displayName: string; email: string} | null>(null);
  
  // Modal de error
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState<{title?: string; message: string}>({message: ''});
  
  // Estados de error para FA01-FA05
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [birthDateError, setBirthDateError] = useState<string>("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // FA02 - Validar formato de email con dominios comunes
  const validateEmail = (email: string): { valid: boolean; message?: string } => {
    // Validación básica de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: "El formato del correo electrónico no es válido" };
    }

    // Extraer dominio completo
    const domain = email.split('@')[1]?.toLowerCase().trim();
    
    if (!domain) {
      return { valid: false, message: "El dominio del correo no es válido" };
    }

    // Validaciones de formato del dominio
    if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
      return { valid: false, message: "El dominio del correo no es válido" };
    }

    // Lista exhaustiva de dominios de email conocidos y confiables
    const trustedDomains = [
      // Proveedores principales
      'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 
      'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com', 'aol.com',
      // Proveedores alternativos
      'protonmail.com', 'proton.me', 'tutanota.com', 'zoho.com', 'mail.com',
      'yandex.com', 'gmx.com', 'fastmail.com', 'inbox.com',
      // Variantes internacionales
      'hotmail.es', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.it',
      'outlook.es', 'outlook.co.uk', 'outlook.fr', 'outlook.de',
      'yahoo.es', 'yahoo.com.mx', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de',
      'live.es', 'live.co.uk', 'live.fr', 'live.de',
      // Gmail internacionales
      'gmail.es', 'gmail.co.uk', 'gmail.fr', 'gmail.de',
    ];

    // SOLO acepta dominios que estén explícitamente en la lista
    if (trustedDomains.includes(domain)) {
      return { valid: true };
    }

    // Rechazar cualquier otro dominio
    return { 
      valid: false, 
      message: "Por favor usa un correo de un proveedor conocido (Gmail, Outlook, Yahoo, Hotmail, etc.)" 
    };
  };

  // FA04 - Validar contraseña segura (RN-01)
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[A-Z]/.test(password)) {
      return "Debe contener al menos una letra mayúscula";
    }
    if (!/[a-z]/.test(password)) {
      return "Debe contener al menos una letra minúscula";
    }
    if (!/[0-9]/.test(password)) {
      return "Debe contener al menos un número";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Debe contener al menos un carácter especial (!@#$%^&*...)";
    }
    return null;
  };

  // FA03 - Validar edad mínima (18 años)
  const validateAge = (birthDate: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    if (age > 18) return true;
    if (age === 18) {
      if (monthDiff > 0) return true;
      if (monthDiff === 0 && dayDiff >= 0) return true;
    }
    return false;
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const convertDateToBackend = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(selectedDate);
      // FA03 - Validar edad
      if (!validateAge(selectedDate)) {
        setBirthDateError("Debes ser mayor de 18 años para registrarte");
      } else {
        setBirthDateError("");
      }
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // FA02 - Validar email en tiempo real
    if (text.trim()) {
      const validation = validateEmail(text.trim());
      if (!validation.valid) {
        setEmailError(validation.message || "Correo electrónico inválido");
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // FA04 - Validar contraseña en tiempo real
    if (text) {
      const error = validatePassword(text);
      setPasswordError(error || "");
    } else {
      setPasswordError("");
    }
    
    // Si ya hay confirmación, validar coincidencia
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    // Validar coincidencia en tiempo real
    if (text && password && text !== password) {
      setConfirmPasswordError("Las contraseñas no coinciden");
    } else {
      setConfirmPasswordError("");
    }
  };

  const showError = (message: string, title?: string) => {
    setErrorModalData({ message, title });
    setShowErrorModal(true);
  };

  const handleRegister = async () => {
    // Validaciones básicas
    if (!name.trim()) {
      showError('Por favor ingresa tu nombre completo');
      return;
    }
    if (!nickname.trim()) {
      showError('Por favor ingresa tu apodo');
      return;
    }
    
    // FA02 - Validar formato de email
    if (!email.trim()) {
      setEmailError('Por favor ingresa tu correo electrónico');
      return;
    }
    const emailValidation = validateEmail(email.trim());
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message || 'El correo electrónico no es válido');
      return;
    }
    
    // FA04 - Validar contraseña
    if (!password) {
      setPasswordError('Por favor ingresa una contraseña');
      return;
    }
    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }
    
    if (!confirmPassword) {
      setConfirmPasswordError('Por favor confirma tu contraseña');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    // FA03 - Validar edad mínima
    if (!birthDate) {
      setBirthDateError('Por favor selecciona tu fecha de nacimiento');
      return;
    }
    if (!validateAge(birthDate)) {
      setBirthDateError('Debes ser mayor de 18 años para registrarte');
      return;
    }
    
    if (!termsAccepted) {
      showError('Debes aceptar los términos y condiciones para continuar', 'Términos y condiciones');
      return;
    }

    setLoading(true);

    const registerData: RegisterRequest = {
      email: email.trim(),
      password,
      confirmPassword,
      displayName: name.trim(),
      nickname: nickname.trim(),
      birthDate: convertDateToBackend(birthDate),
      termsAccepted: true,
    };

    console.log('Enviando datos de registro:', registerData); // Debug

    try {
      const result = await authService.register(registerData);

      console.log('Respuesta del servidor:', result); // Debug

      setLoading(false);

      if (result.data) {
        // Registro exitoso
        setSuccessData({
          displayName: result.data.displayName,
          email: email.trim(),
        });
        setShowSuccessModal(true);
      } else if (result.error) {
      // Error en el registro
      let errorMessage = result.error.message;
      
      // FA01 - Correo ya registrado
      if (errorMessage.toLowerCase().includes('email') || 
          errorMessage.toLowerCase().includes('correo') ||
          errorMessage.toLowerCase().includes('already exists')) {
        setEmailError('Este correo electrónico ya está registrado. Por favor usa otro diferente.');
        return;
      }
      
      // FA05 - Error al enviar correo de verificación
      if (errorMessage.toLowerCase().includes('email') && 
          errorMessage.toLowerCase().includes('send')) {
        showError(
          'No pudimos enviar el correo de verificación. Por favor intenta más tarde.',
          'Error de verificación'
        );
        return;
      }
      
      // Si hay errores de validación específicos
      if (result.error.validationErrors) {
        const errors = result.error.validationErrors;
        
        if (errors.email) {
          setEmailError(errors.email);
        }
        if (errors.password) {
          setPasswordError(errors.password);
        }
        if (errors.birthDate) {
          setBirthDateError(errors.birthDate);
        }
        
        // Mostrar otros errores generales
        const otherErrors = Object.entries(errors)
          .filter(([key]) => !['email', 'password', 'birthDate'].includes(key))
          .map(([, value]) => value)
          .join('\n');
        
        if (otherErrors) {
          showError(otherErrors, 'Error en el registro');
        }
      } else {
        // Error genérico
        showError(errorMessage, 'Error en el registro');
      }
      }
    } catch (error) {
      setLoading(false);
      console.error('Error inesperado en registro:', error);
      showError('Ocurrió un error inesperado. Por favor intenta de nuevo.', 'Error');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/welcome")}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Completa tus datos para comenzar
          </Text>

          {/* Nombre */}
          <View style={styles.field}>
            <Text style={styles.label}>Nombre completo</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#1A1A1A66"
                style={styles.iconLeft}
              />
              <TextInput
                placeholder="María García"
                placeholderTextColor="#1A1A1A66"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>
          </View>

          {/* Apodo */}
          <View style={styles.field}>
            <Text style={styles.label}>Apodo</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="at-outline"
                size={20}
                color="#1A1A1A66"
                style={styles.iconLeft}
              />
              <TextInput
                placeholder="mari_love"
                placeholderTextColor="#1A1A1A66"
                value={nickname}
                onChangeText={setNickname}
                style={styles.input}
              />
            </View>
          </View>

          {/* Correo */}
          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailError ? "#FF4F81" : "#1A1A1A66"}
                style={styles.iconLeft}
              />
              <TextInput
                placeholder="tu@email.com"
                placeholderTextColor="#1A1A1A66"
                value={email}
                onChangeText={handleEmailChange}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#FF4F81" />
                <Text style={styles.errorText}>{emailError}</Text>
              </View>
            ) : null}
          </View>

          {/* Contraseña */}
          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordError ? "#FF4F81" : "#1A1A1A66"}
                style={styles.iconLeft}
              />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#1A1A1A66"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.iconRight}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#1A1A1A66"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#FF4F81" />
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            ) : null}
          </View>

          {/* Confirmar Contraseña */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={[styles.inputWrapper, confirmPasswordError ? styles.inputError : null]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={confirmPasswordError ? "#FF4F81" : "#1A1A1A66"}
                style={styles.iconLeft}
              />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#1A1A1A66"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.iconRight}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#1A1A1A66"
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#FF4F81" />
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              </View>
            ) : null}
          </View>

          {/* Fecha de Nacimiento */}
          <View style={styles.field}>
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <TouchableOpacity
              style={[styles.inputWrapper, birthDateError ? styles.inputError : null]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={birthDateError ? "#FF4F81" : "#1A1A1A66"}
                style={styles.iconLeft}
              />
              <Text style={[styles.input, styles.dateText, !birthDate && styles.placeholder]}>
                {birthDate ? formatDate(birthDate) : 'DD/MM/YYYY'}
              </Text>
            </TouchableOpacity>
            {birthDateError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#FF4F81" />
                <Text style={styles.errorText}>{birthDateError}</Text>
              </View>
            ) : null}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              accentColor="#FF4F81"
              textColor="#1A1A1A"
            />
          )}

          {/* Términos y Condiciones */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxWrapper}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                {termsAccepted && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
              <View style={styles.termsTextWrapper}>
                <Text style={styles.termsText}>
                  Acepto los{' '}
                  <Text style={styles.termsLink}>términos y condiciones</Text>
                  {' '}y la{' '}
                  <Text style={styles.termsLink}>política de privacidad</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Botón de crear cuenta */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.buttonWrapper}
            onPress={handleRegister}
            disabled={loading || !termsAccepted}
          >
            <LinearGradient
              colors={termsAccepted ? ["#FF4F81", "#8A2BE2"] : ["#FFB3C6", "#C9A8E8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, !termsAccepted && styles.buttonTextDisabled]}>
                  Crear cuenta
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Enlace para login */}
          <View style={styles.loginWrapper}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modal de éxito */}
      <SuccessModal
        visible={showSuccessModal}
        title="¡Cuenta creada exitosamente!"
        message={`Hemos enviado un código de verificación a ${successData?.email || email.trim()}. Revisa tu bandeja de entrada y spam.`}
        buttonText="Verificar ahora"
        onClose={() => {
          setShowSuccessModal(false);
          router.push({
            pathname: '/(auth)/verify-email',
            params: { email: successData?.email || email.trim() }
          });
        }}
      />

      {/* Modal de error */}
      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorModalData.title}
        message={errorModalData.message}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backButton: { padding: 6, borderRadius: 20 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60 },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  subtitle: { color: "#1A1A1A99", marginBottom: 24, fontSize: 14 },
  field: { marginBottom: 20 },
  label: { color: "#1A1A1A", marginBottom: 8, fontSize: 14 },
  inputWrapper: {
    position: "relative",
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    height: 56,
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "#FF4F81",
    backgroundColor: "#FFF5F7",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#FF4F81",
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  iconLeft: { position: "absolute", left: 16 },
  iconRight: { position: "absolute", right: 16 },
  input: {
    height: "100%",
    paddingLeft: 44,
    paddingRight: 44,
    fontSize: 16,
    color: "#1A1A1A",
  },
  dateText: {
    lineHeight: 56,
    paddingTop: 0,
    paddingBottom: 0,
  },
  placeholder: {
    color: "#1A1A1A66",
  },
  termsContainer: {
    marginBottom: 24,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  termsTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  termsText: {
    color: '#1A1A1A',
    opacity: 0.8,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: '#FF4F81',
    fontWeight: '600',
  },
  buttonWrapper: {
    marginTop: 8,
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
    fontSize: 16 
  },
  buttonTextDisabled: {
    color: "#1A1A1A66",
  },
  loginWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  loginText: { color: "#1A1A1A99" },
  loginLink: { color: "#FF4F81", fontWeight: "600" },
});
