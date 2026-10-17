import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { palette } from "../../../constants/colors";

interface OptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Chip de opcion unica de los formularios de recomendacion (Figma "Chip"): blanco con borde; el
 * elegido va en rosa claro con borde rosa y texto morado.
 */
export function OptionChip({ label, selected, onPress, disabled }: OptionChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  selected: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: palette.text,
  },
  labelSelected: {
    color: palette.textAccent,
  },
});
