import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, gradients } from "../../constants/colors";
import { decorativeLoop, motionMs } from "../../utils/motion";
import { GradientButton } from "../components/ui/GradientButton";

/** Figma H1 (opción B): la bienvenida de siempre, pulida. El texto de apoyo es de la usuaria. */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: motionMs(600), delay: 150, useNativeDriver: true }).start();
    decorativeLoop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const appear = {
    opacity: fadeIn,
    transform: [{ translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };
  const bubbleScale = (from: number, to: number) => ({
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) }],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
      <Animated.View style={[styles.illustration, appear]}>
        <LinearGradient colors={gradients.soft} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.circle}>
          <View style={styles.logoCard}>
            <Image source={require("@/assets/images/icon.svg")} style={styles.logo} contentFit="contain" />
          </View>
          <Animated.View style={[styles.bubble, styles.bubbleCalendar, bubbleScale(1, 1.08)]}>
            <Ionicons name="calendar-outline" size={26} color={palette.secondary} />
          </Animated.View>
          <Animated.View style={[styles.bubble, styles.bubbleLink, bubbleScale(1.08, 1)]}>
            <Ionicons name="link-outline" size={26} color={palette.primary} />
          </Animated.View>
        </LinearGradient>

        <Text style={styles.title} accessibilityRole="header">
          Te damos la bienvenida a Nexus
        </Text>
        <Text style={styles.subtitle}>
          La vida es más divertida juntos. Nexus dice cuándo, tú pones las reglas.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.buttons, { opacity: fadeIn }]}>
        <GradientButton title="Iniciar sesión" onPress={() => router.push("/(auth)/login")} />
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/register")}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Crear cuenta</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  illustration: { flex: 1, alignItems: "center", justifyContent: "center" },
  circle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCard: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  logo: { width: 80, height: 80 },
  bubble: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bubbleCalendar: { top: 10, right: 0 },
  bubbleLink: { bottom: 18, left: 8 },
  title: {
    marginTop: 36,
    fontSize: 24,
    fontWeight: "700",
    color: palette.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: palette.textSecondary,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  buttons: { width: "100%", gap: 12 },
  secondaryButton: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryText: {
    color: palette.textAccent,
    fontWeight: "700",
    fontSize: 16,
  },
});
