import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { palette, gradients } from "../../../constants/colors";

/** Barra de pasos (Figma H2/H3): segmentos hechos en degradado, los que faltan en gris. */
export function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${step} de ${total}`}
      accessibilityValue={{ min: 1, max: total, now: step }}
    >
      {Array.from({ length: total }, (_, i) =>
        i < step ? (
          <LinearGradient key={i} colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.segment} />
        ) : (
          <View key={i} style={[styles.segment, styles.pending]} />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  pending: { backgroundColor: palette.divider },
});
