import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette } from "../../constants/colors";

interface PlanSummaryCardProps {
  title: string;
  /** "Hoy · 18:00 – 20:00" */
  when: string;
  place?: string;
  /** "$150 por persona" o "Gratis" */
  cost?: string;
  /** Etiqueta de estado, p. ej. "Pendiente de Sam". */
  pendingLabel?: string;
}

const Row = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={20} color={palette.textAccent} />
    <Text style={styles.rowText}>{text}</Text>
  </View>
);

/** Resumen del plan dentro de los modales de invitacion (Figma A6-A8). */
export function PlanSummaryCard({ title, when, place, cost, pendingLabel }: PlanSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Row icon="calendar-outline" text={when} />
      {place ? <Row icon="location-outline" text={place} /> : null}
      {cost ? <Row icon="cash-outline" text={cost} /> : null}
      {pendingLabel && (
        <View style={styles.pending}>
          <Ionicons name="hourglass-outline" size={14} color={palette.warning} />
          <Text style={styles.pendingText}>{pendingLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.primarySoft,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: palette.textSecondary,
  },
  pending: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: palette.warningSoft,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.warning,
  },
});
