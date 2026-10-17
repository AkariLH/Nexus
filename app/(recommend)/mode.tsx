import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../../constants/colors";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { GradientButton } from "../components/ui/GradientButton";

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
 * Figma A1 - RF-37: elegir modalidad. "En pareja" (RF-38/39) llega con la ola 7'; mientras, se ve
 * desactivada.
 */
export default function RecommendationModeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScreenHeader title="Pedir recomendación" onBack={() => router.back()} />
      <View style={styles.content}>
        <Text style={styles.heading}>¿Cómo quieren planear?</Text>
        <ModeOption
          icon="person-outline"
          title="Individual"
          subtitle="Tú eliges y le envías la invitación."
          selected
          onPress={() => {}}
        />
        <ModeOption
          icon="people-outline"
          title="En pareja"
          subtitle="Eligen juntos y pueden mandarse mensajes."
          selected={false}
          disabled
          onPress={() => {}}
        />
      </View>
      <View style={styles.footer}>
        <GradientButton title="Continuar" onPress={() => router.push("/(recommend)/request")} />
      </View>
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
