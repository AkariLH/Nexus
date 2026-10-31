import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import planningService from "../../services/planning.service";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { GradientButton } from "../components/ui/GradientButton";
import { ResultModal } from "../components/ResultModal";

interface ModeOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const ModeOption = ({ icon, title, subtitle, selected, disabled, onPress }: ModeOptionProps) => (
  <TouchableOpacity
    style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    accessibilityRole="radio"
    accessibilityState={{ selected, disabled }}
  >
    <View style={styles.optionIcon}>
      <Ionicons name={icon} size={24} color={selected ? palette.text : palette.textAccent} />
    </View>
    <View style={styles.optionText}>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionSubtitle}>{subtitle}</Text>
    </View>
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioDot} />}
    </View>
  </TouchableOpacity>
);

/**
 * Figma A1 - RF-37 / RF-38: elegir modalidad. "En pareja" invita a planear juntos; si ya hay una
 * planeacion abierta, vuelve a ella.
 */
export default function RecommendationModeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { slotDate, slotStart, slotEnd } = useLocalSearchParams<{ slotDate?: string; slotStart?: string; slotEnd?: string }>();
  const [mode, setMode] = useState<"INDIVIDUAL" | "JOINT">("INDIVIDUAL");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startJoint = async () => {
    if (!user?.userId) return;
    setStarting(true);
    try {
      const current = await planningService.current(user.userId);
      const open = current && ["INVITED", "FILTERS", "OPTIONS", "PROPOSAL"].includes(current.phase);
      if (!open) await planningService.invite(user.userId);
      router.replace("/(planning)/session");
    } catch (e: any) {
      setError(e?.message || "No se pudo enviar la invitación.");
    } finally {
      setStarting(false);
    }
  };

  // [libres-juntos] Desde una propuesta, el horario pasa a «Detalles de la cita».
  const proceed = () =>
    mode === "INDIVIDUAL"
      ? router.push(slotDate ? { pathname: "/(recommend)/request", params: { slotDate, slotStart, slotEnd } } : "/(recommend)/request")
      : startJoint();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScreenHeader title="Pedir recomendación" onBack={() => router.back()} />
      <View style={styles.content}>
        <Text style={styles.heading}>¿Cómo quieren planear?</Text>
        <ModeOption
          icon="person-outline"
          title="Individual"
          subtitle="Tú eliges y le envías la invitación."
          selected={mode === "INDIVIDUAL"}
          onPress={() => setMode("INDIVIDUAL")}
        />
        <ModeOption
          icon="people-outline"
          title="En pareja"
          subtitle="Eligen juntos y pueden mandarse mensajes."
          selected={mode === "JOINT"}
          onPress={() => setMode("JOINT")}
        />
      </View>
      <View style={styles.footer}>
        <GradientButton title="Continuar" onPress={proceed} loading={starting} />
      </View>

      <ResultModal
        visible={error !== null}
        icon="alert-circle-outline"
        tone="warning"
        title="No se pudo completar"
        subtitle={error ?? undefined}
        primary={{ label: "Entendido", onPress: () => setError(null) }}
        onRequestClose={() => setError(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: palette.text,
    marginTop: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.secondarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.text,
  },
  optionSubtitle: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.onPrimary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
});
