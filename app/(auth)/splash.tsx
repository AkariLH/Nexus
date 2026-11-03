import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { palette, gradients } from "../../constants/colors";
import { decorativeLoop, motionMs } from "../../utils/motion";
import { useAuth } from "../../context/AuthContext";

/** Figma H0: el splash dura 2 s en total (antes 1.2 s; ella lo pidió más largo el 2026-11-03). */
const SPLASH_MS = 2000;

/** Corazones tenues de fondo (posicion, tamano y cuanto flotan). */
const HEARTS = [
  { style: { top: "15%", left: "11%" }, size: 26, drift: -10 },
  { style: { top: "27%", right: "17%" }, size: 22, drift: 8 },
  { style: { bottom: "22%", left: "18%" }, size: 28, drift: -8 },
  { style: { bottom: "18%", right: "22%" }, size: 18, drift: 6 },
] as const;

export default function SplashScreen() {
  const router = useRouter();
  // Al terminar: con sesion va a la app; sin sesion, a la bienvenida.
  const { user } = useAuth();
  const hasSession = useRef(false);
  hasSession.current = !!user;

  const grow = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // El logo crece (sin girar) y luego aparecen el nombre y el lema.
    Animated.timing(grow, {
      toValue: 1,
      duration: motionMs(600),
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
    Animated.timing(fade, {
      toValue: 1,
      delay: motionMs(300),
      duration: motionMs(450),
      useNativeDriver: true,
    }).start();
    decorativeLoop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => {
      router.replace(hasSession.current ? "/(tabs)" : "/(auth)/welcome");
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      {HEARTS.map((heart, i) => (
        <Animated.View
          key={i}
          style={[
            styles.heart,
            heart.style,
            { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, heart.drift] }) }] },
          ]}
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name="heart" size={heart.size} color={palette.onPrimaryFaint} />
        </Animated.View>
      ))}

      <Animated.View
        style={{
          opacity: grow.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        }}
      >
        <View style={styles.logoBox}>
          <Image source={require("@/assets/images/icon.svg")} style={styles.logo} contentFit="contain" />
        </View>
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: fade }]} accessibilityRole="header">
        Nexus
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: fade }]}>Su tiempo, juntos</Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  heart: {
    position: "absolute",
  },
  logoBox: {
    width: 112,
    height: 112,
    backgroundColor: palette.surface,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: palette.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    marginTop: 20,
    fontSize: 40,
    fontWeight: "700",
    color: palette.onPrimary,
  },
  tagline: {
    marginTop: 12,
    fontSize: 16,
    color: palette.onPrimarySoft,
  },
});
