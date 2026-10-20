import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SatisfactionFace } from "../../components/SatisfactionFace";
import { MetaLine } from "../../components/ui/Surface";
import { palette } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import ratingService from "../../services/rating.service";
import { dateLine, SATISFACTION_LABELS } from "../../utils/ratingFormat";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { GradientButton } from "../components/ui/GradientButton";

/** Figma C12b: elegir de 1 a 5 que tan satisfecho/a quedo con la cita (CU42). */
export default function RateDateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { eventId, title, start, end, location } = useLocalSearchParams<{
    eventId: string;
    title: string;
    start: string;
    end: string;
    location?: string;
  }>();
  const [score, setScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const timeRange = start && end ? `${dateLine(start, null, now)} – ${clock(end)}` : "";

  const save = async () => {
    if (!user?.userId || !score || !eventId) return;
    setSaving(true);
    setError("");
    try {
      await ratingService.rate(user.userId, Number(eventId), score);
      // C13: el aviso de "¡Gracias por calificar!" sale sobre la lista.
      router.replace({ pathname: "/(rating)/pending-ratings", params: { rated: "1" } });
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar tu calificación. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Calificar cita" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dateCard}>
          <Text style={styles.dateTitle}>{title}</Text>
          {timeRange ? <MetaLine icon="calendar-outline" text={timeRange} /> : null}
          {location ? <MetaLine icon="location-outline" text={location} /> : null}
        </View>

        <Text style={styles.question} accessibilityRole="header">
          ¿Qué tan satisfecho/a quedaste con esta cita?
        </Text>

        <View style={styles.scale} accessibilityRole="radiogroup">
          {SATISFACTION_LABELS.map((label, i) => {
            const value = i + 1;
            const selected = score === value;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => setScore(value)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={label}
              >
                <SatisfactionFace score={value} size={34} />
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]} numberOfLines={1}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.privacy}>
          <Ionicons name="lock-closed-outline" size={18} color={palette.textAccent} />
          <Text style={styles.privacyText}>Tu pareja no verá tu calificación.</Text>
        </View>

        {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GradientButton title="Guardar calificación" onPress={save} loading={saving} disabled={!score} />
      </View>
    </View>
  );
}

function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 20 },
  dateCard: {
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: palette.primarySoft,
  },
  dateTitle: { fontSize: 16, fontWeight: "600", color: palette.text },
  question: { fontSize: 22, fontWeight: "700", color: palette.text, textAlign: "center" },
  scale: { flexDirection: "row", gap: 6 },
  option: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  optionSelected: { borderWidth: 2, borderColor: palette.primary, backgroundColor: palette.primarySoft },
  optionLabel: { fontSize: 11, color: palette.textSecondary },
  optionLabelSelected: { color: palette.textAccent, fontWeight: "600" },
  privacy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.secondarySoft,
  },
  privacyText: { fontSize: 14, color: palette.textSecondary },
  error: { fontSize: 13, color: palette.error, textAlign: "center" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
    backgroundColor: palette.surface,
  },
});
