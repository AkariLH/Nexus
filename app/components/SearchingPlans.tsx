import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { palette, gradients } from "../../constants/colors";
import { decorativeLoop } from "../../utils/motion";

interface SearchingPlansProps {
  /** Sin zona no se menciona la distancia. */
  withDistance: boolean;
}

const STEP_MS = 550;

/**
 * Figma A4 - "Buscando planes para ustedes", animada para que la espera sea amena: el circulo
 * late, los pasos se van palomeando y el reloj de arena gira en el ultimo.
 */
export function SearchingPlans({ withDistance }: SearchingPlansProps) {
  const steps = ["Sus preferencias", ...(withDistance ? ["Lugares a menos de 15 km"] : []), "Horario libre de los dos"];
  const [done, setDone] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const beat = decorativeLoop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const turn = decorativeLoop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }),
    );
    beat.start();
    turn.start();
    return () => {
      beat.stop();
      turn.stop();
    };
  }, [pulse, spin]);

  useEffect(() => {
    if (done >= steps.length) return;
    const timer = setTimeout(() => setDone((d) => d + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [done, steps.length]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.circle}>
          <Ionicons name="sparkles-outline" size={40} color={palette.onPrimary} />
        </LinearGradient>
      </Animated.View>

      <Text style={styles.title}>Buscando planes para ustedes</Text>

      <View style={styles.card}>
        {steps.map((label, index) => (
          <View key={label} style={styles.row}>
            <Ionicons
              name={index < done ? "checkmark-circle-outline" : "ellipse-outline"}
              size={20}
              color={index < done ? palette.success : palette.iconDisabled}
            />
            <Text style={[styles.rowText, index >= done && styles.rowTextWaiting]}>{label}</Text>
          </View>
        ))}
        {done >= steps.length && (
          <View style={styles.row}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="hourglass-outline" size={20} color={palette.textAccent} />
            </Animated.View>
            <Text style={styles.rowTextActive}>Redactando sugerencias…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: palette.background,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginTop: 20,
    marginBottom: 16,
    fontSize: 20,
    fontWeight: "600",
    color: palette.text,
    textAlign: "center",
  },
  card: {
    alignSelf: "stretch",
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    minHeight: 150,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowText: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  rowTextWaiting: {
    color: palette.textMuted,
  },
  rowTextActive: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.textAccent,
  },
});
