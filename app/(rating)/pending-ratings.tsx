import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card, Pill, SectionLabel, SoftIcon } from "../../components/ui/Surface";
import { palette } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import ratingService, { PendingRating } from "../../services/rating.service";
import { dateLine, timeLeftLabel } from "../../utils/ratingFormat";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { ResultModal } from "../components/ResultModal";

/** Figma C12a: citas que aun puedo calificar; C13: "¡Gracias por calificar!" al volver. */
export default function PendingRatingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { rated } = useLocalSearchParams<{ rated?: string }>();
  const [pending, setPending] = useState<PendingRating[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user?.userId) return;
    setError(false);
    try {
      setPending(await ratingService.pending(user.userId));
    } catch {
      setError(true);
      setPending([]);
    }
  }, [user?.userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const now = new Date();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Calificar citas" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.privacy}>
          <Ionicons name="lock-closed-outline" size={18} color={palette.textAccent} />
          <Text style={styles.privacyText}>Tu calificación es privada.</Text>
        </View>

        <SectionLabel>Pendientes</SectionLabel>

        {pending === null ? (
          <ActivityIndicator color={palette.primary} style={styles.loader} />
        ) : error ? (
          <Text style={styles.empty}>No se pudieron cargar tus citas. Inténtalo de nuevo.</Text>
        ) : pending.length === 0 ? (
          <Text style={styles.empty}>No tienes citas por calificar.</Text>
        ) : (
          pending.map((item) => (
            <TouchableOpacity
              key={item.eventId}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Calificar ${item.title}`}
              onPress={() =>
                router.push({
                  pathname: "/(rating)/rate-date",
                  params: {
                    eventId: String(item.eventId),
                    title: item.title,
                    start: item.startDateTime,
                    end: item.endDateTime,
                    location: item.location ?? "",
                  },
                })
              }
            >
              <Card style={styles.card}>
                <SoftIcon name="calendar-outline" />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.cardLine}>{dateLine(item.startDateTime, item.location, now)}</Text>
                  <Pill tone="warning" label={timeLeftLabel(item.expiresAt, now)} />
                </View>
                <Ionicons name="chevron-forward" size={20} color={palette.icon} />
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ResultModal
        visible={rated === "1"}
        icon="checkmark-circle-outline"
        animateIcon
        title="¡Gracias por calificar!"
        primary={{ label: "Listo", onPress: () => router.setParams({ rated: undefined }) }}
        onRequestClose={() => router.setParams({ rated: undefined })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32, gap: 16 },
  privacy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.secondarySoft,
  },
  privacyText: { fontSize: 14, color: palette.textSecondary },
  loader: { marginTop: 24 },
  empty: { fontSize: 14, color: palette.textSecondary },
  card: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: palette.text },
  cardLine: { fontSize: 12, color: palette.textSecondary },
});
