import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const inputs = useRef<TextInput[]>([]);
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

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Focus siguiente input
      if (value && index < 5) {
        inputs.current[index + 1]?.focus();
      }
    }
  };

  const isComplete = code.every((d) => d);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/register")}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Ícono */}
        <View style={styles.iconWrapper}>
          <Ionicons name="mail-outline" size={48} color="#FF4F81" />
        </View>

        <Text style={styles.title}>Verifica tu correo</Text>
        <Text style={styles.subtitle}>
          Ingresa el código de 6 dígitos que enviamos a tu correo electrónico
        </Text>

        {/* Inputs del código */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) {
                  inputs.current[index] = ref;
                }
              }}
              value={digit}
              onChangeText={(value) => handleCodeChange(index, value)}
              keyboardType="numeric"
              maxLength={1}
              style={styles.codeInput}
            />
          ))}
        </View>

        {/* Botón de verificación */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!isComplete}
          style={[styles.buttonWrapper, !isComplete && { opacity: 0.5 }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <LinearGradient
            colors={["#FF4F81", "#8A2BE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Verificar</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Reenviar código */}
        <View style={styles.resendWrapper}>
          <Text style={styles.resendText}>¿No recibiste el código? </Text>
          <TouchableOpacity>
            <Text style={styles.resendLink}>Reenviar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backButton: { padding: 6, borderRadius: 20 },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,79,129,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#1A1A1A99",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 40,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    textAlign: "center",
    fontSize: 24,
    color: "#1A1A1A",
    borderWidth: 2,
    borderColor: "transparent",
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
  resendWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  resendText: {
    color: "#1A1A1A99",
  },
  resendLink: {
    color: "#FF4F81",
    fontWeight: "600",
  },
});
