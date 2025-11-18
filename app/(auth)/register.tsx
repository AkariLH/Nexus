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
    Alert,
    ActivityIndicator,
} from "react-native";
import { authService } from "../../services/auth.service";
import type { RegisterRequest } from "../../types/auth.types";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState(""); // formato: DD/MM/YYYY
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Formatear fecha mientras escribe (DD/MM/YYYY)
  const handleBirthDateChange = (text: string) => {
    // Eliminar caracteres no numéricos
    const numbers = text.replace(/[^\d]/g, '');
    
    let formatted = numbers;
    if (numbers.length >= 2) {
      formatted = numbers.slice(0, 2) + '/';
      if (numbers.length >= 4) {
        formatted += numbers.slice(2, 4) + '/';
        formatted += numbers.slice(4, 8);
      } else {
        formatted += numbers.slice(2);
      }
    }
    
    setBirthDate(formatted);
  };

  // Convertir DD/MM/YYYY a YYYY-MM-DD para el backend
  const convertDateFormat = (date: string): string => {
    const parts = date.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  const handleRegister = async () => {
    // Validaciones básicas
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre completo');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Por favor ingresa una contraseña');
      return;
    }
    if (!confirmPassword) {
      Alert.alert('Error', 'Por favor confirma tu contraseña');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (birthDate.length !== 10) {
      Alert.alert('Error', 'Por favor ingresa una fecha de nacimiento válida (DD/MM/YYYY)');
      return;
    }

    setLoading(true);

    const registerData: RegisterRequest = {
      email: email.trim(),
      password,
      confirmPassword,
      displayName: name.trim(),
      birthDate: convertDateFormat(birthDate),
    };

    // Solo agregar nickname si no está vacío
    if (nickname.trim()) {
      registerData.nickname = nickname.trim();
    }

    console.log('Enviando datos de registro:', registerData); // Debug

    const result = await authService.register(registerData);

    console.log('Respuesta del servidor:', result); // Debug

    setLoading(false);

    if (result.data) {
      // Registro exitoso
      Alert.alert(
        '¡Registro exitoso!',
        `Bienvenido ${result.data.displayName}!\nTu código de vinculación es: ${result.data.linkCode}`,
        [
          {
            text: 'Continuar',
            onPress: () => router.push('/(auth)/verify-email'),
          },
        ]
      );
    } else if (result.error) {
      // Error en el registro
      let errorMessage = result.error.message;
      
      // Si hay errores de validación, mostrarlos
      if (result.error.validationErrors) {
        const errors = Object.values(result.error.validationErrors).join('\n');
        errorMessage = errors;
      }
      
      Alert.alert('Error en el registro', errorMessage);
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
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#1A1A1A66"
                style={styles.iconLeft}
              />
              <TextInput
                placeholder="tu@email.com"
                placeholderTextColor="#1A1A1A66"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#1A1A1A66"
                style={styles.iconLeft}
              />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#1A1A1A66"
                value={password}
                onChangeText={setPassword}
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
          </View>

          {/* Confirmar Contraseña */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#1A1A1A66"
                style={styles.iconLeft}
              />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#1A1A1A66"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
          </View>

          {/* Fecha de Nacimiento */}
          <View style={styles.field}>
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#1A1A1A66"
                style={styles.iconLeft}
              />
              <TextInput
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#1A1A1A66"
                value={birthDate}
                onChangeText={handleBirthDateChange}
                style={styles.input}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          {/* Botón de crear cuenta */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.buttonWrapper}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={["#FF4F81", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Crear cuenta</Text>
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
  subtitle: { color: "#1A1A1A99", marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { color: "#1A1A1A", marginBottom: 8, fontSize: 14 },
  inputWrapper: {
    position: "relative",
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    height: 56,
    justifyContent: "center",
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
  buttonWrapper: {
    marginTop: 16,
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
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  loginWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  loginText: { color: "#1A1A1A99" },
  loginLink: { color: "#FF4F81", fontWeight: "600" },
});
