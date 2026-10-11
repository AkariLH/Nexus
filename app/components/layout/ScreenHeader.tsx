import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "../../../constants/colors";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  backDisabled?: boolean;
  /** Accion a la derecha del titulo (un boton de icono o de texto). */
  right?: ReactNode;
}

/**
 * Encabezado de las pantallas que se abren sobre las pestañas: flecha de regreso, titulo
 * centrado y una accion opcional. Respeta el area segura real del dispositivo.
 */
export function ScreenHeader({ title, onBack, backDisabled, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity
        onPress={onBack}
        disabled={backDisabled}
        style={styles.side}
        accessibilityRole="button"
        accessibilityLabel="Regresar"
      >
        <Ionicons name="arrow-back" size={24} color={palette.text} />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  side: {
    minWidth: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: palette.text,
  },
});
