import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette, gradients } from "../../constants/colors";
import type { RecommendationItem } from "../../services/recommendation.service";
import { formatDuration } from "../../utils/ideaFormat";
import { costLabel, placeLabel, slotLabel } from "../../utils/recommendationFormat";

interface RecommendationCardProps {
  item: RecommendationItem;
  now: Date;
  busy?: boolean;
  onDiscard: () => void;
  onInvite: () => void;
}

const Meta = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.meta}>
    <Ionicons name={icon} size={16} color={palette.icon} />
    <Text style={styles.metaText}>{text}</Text>
  </View>
);

/**
 * RF-37 - Tarjeta de una recomendacion individual (Figma "Tarjeta recomendación"): mismo diseño que
 * la conjunta, con la franja de horario en lugar de votos.
 */
export function RecommendationCard({ item, now, busy, onDiscard, onInvite }: RecommendationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.categoryLabel}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Meta icon="location-outline" text={placeLabel(item)} />
        <Meta icon="time-outline" text={formatDuration(item.durationMinutes)} />
        <Meta icon="cash-outline" text={costLabel(item.costPerPersonMxn)} />
      </View>

      {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}

      <View style={styles.slot}>
        <Ionicons name="calendar-outline" size={16} color={palette.textAccent} />
        <Text style={styles.slotText}>{slotLabel(item.startsAt, item.endsAt, now)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.discard}
          onPress={onDiscard}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Descartar ${item.title}`}
        >
          {busy ? (
            <ActivityIndicator size="small" color={palette.textAccent} />
          ) : (
            <Text style={styles.discardText}>Descartar</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inviteWrapper}
          onPress={onInvite}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Invitar a ${item.title}`}
        >
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.invite}>
            <Text style={styles.inviteText}>Invitar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: palette.text,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: palette.secondarySoft,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.textAccent,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: 6,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  reason: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
  },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: palette.secondarySoft,
  },
  slotText: {
    fontSize: 13,
    color: palette.text,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  discard: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  discardText: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.textAccent,
  },
  inviteWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  invite: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  inviteText: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.onPrimary,
  },
});
