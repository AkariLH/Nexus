import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  // Animaciones
  const heartRotate = useRef(new Animated.Value(0)).current;
  const iconScale1 = useRef(new Animated.Value(1)).current;
  const iconScale2 = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Oscilación del corazón
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartRotate, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(heartRotate, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulso de iconos secundarios
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale1, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconScale2, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(iconScale2, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 500);

    // Fade in + slide up de texto y botones
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = heartRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-10deg", "10deg"],
  });

  return (
    <View style={styles.container}>
      {/* Área ilustración */}
      <Animated.View
        style={[
          styles.illustration,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <View style={styles.circleBg}>
          <View style={styles.heartContainer}>
            <Image 
              source={require("@/assets/images/icon.svg")} 
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Animated.View
            style={[styles.iconTopRight, { transform: [{ scale: iconScale1 }] }]}
          >
            <Ionicons name="calendar-outline" size={48} color="#8A2BE2" />
          </Animated.View>

          <Animated.View
            style={[styles.iconBottomLeft, { transform: [{ scale: iconScale2 }] }]}
          >
            <Ionicons name="link" size={48} color="#FF4F81" />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.textContainer,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <Text style={styles.title}>Bienvenido a Nexus</Text>
          <Text style={styles.subtitle}>
            Organiza tu vida compartida con tu pareja.{"\n"}Agenda, eventos y vínculos emocionales en un solo lugar.
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Botones */}
      <Animated.View
        style={[
          styles.buttons,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <LinearGradient
            colors={["#FF4F81", "#8A2BE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.primaryText}>Iniciar sesión</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.secondaryText}>Registrarse</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 32,
    paddingBottom: 48,
  },
  illustration: { flex: 1, alignItems: "center", justifyContent: "center" },
  circleBg: {
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: "rgba(255,79,129,0.1)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heartContainer: { justifyContent: "center", alignItems: "center" },
  logo: {
    width: 120,
    height: 120,
  },
  iconTopRight: { position: "absolute", top: 50, right: 25 },
  iconBottomLeft: { position: "absolute", bottom: 50, left: 60 },
  textContainer: { marginTop: 32, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  buttons: { width: "100%", gap: 16 },
  primaryButton: {
    height: 56,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FF4F81",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryText: {
    color: "#FF4F81",
    fontWeight: "700",
    fontSize: 16,
  },
});
