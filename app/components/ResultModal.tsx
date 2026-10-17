import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette, gradients } from "../../constants/colors";
import { GradientButton } from "./ui/GradientButton";

interface ModalAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

interface ResultModalProps {
  visible: boolean;
  title: string;
  /** Icono en el circulo superior; sin icono el modal empieza por el titulo. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** `danger`: circulo rojo claro con icono rojo (rechazos). */
  tone?: "brand" | "danger";
  subtitle?: string;
  /** Tarjeta del plan u otro contenido entre el subtitulo y los botones. */
  children?: ReactNode;
  /** Texto bajo la tarjeta (p. ej. "Tu pareja podrá aceptarla o rechazarla."). */
  footnote?: string;
  /** Aviso de exito con palomita verde. */
  note?: string;
  primary: ModalAction;
  secondary?: ModalAction;
  onRequestClose: () => void;
}

/**
 * Modal centrado de resultados y confirmaciones de las recomendaciones (Figma A6-A9): icono en
 * circulo, titulo, subtitulo, contenido y uno o dos botones.
 */
export function ResultModal({
  visible,
  title,
  icon,
  tone = "brand",
  subtitle,
  children,
  footnote,
  note,
  primary,
  secondary,
  onRequestClose,
}: ResultModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          {icon && tone === "brand" && (
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.icon}>
              <Ionicons name={icon} size={40} color={palette.onPrimary} />
            </LinearGradient>
          )}
          {icon && tone === "danger" && (
            <View style={[styles.icon, styles.iconDanger]}>
              <Ionicons name={icon} size={40} color={palette.error} />
            </View>
          )}

          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          {children && <View style={styles.content}>{children}</View>}
          {footnote && <Text style={styles.footnote}>{footnote}</Text>}

          {note && (
            <View style={styles.note}>
              <Ionicons name="checkmark-circle-outline" size={20} color={palette.success} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          )}

          <GradientButton
            title={primary.label}
            onPress={primary.onPress}
            loading={primary.loading}
            style={styles.primary}
          />
          {secondary && (
            <TouchableOpacity
              style={styles.secondary}
              onPress={secondary.onPress}
              disabled={primary.loading}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{secondary.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: palette.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconDanger: {
    backgroundColor: palette.errorSoft,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: palette.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
    textAlign: "center",
  },
  content: {
    alignSelf: "stretch",
    marginTop: 20,
  },
  footnote: {
    marginTop: 16,
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: "center",
  },
  note: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.successSoft,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
  },
  primary: {
    alignSelf: "stretch",
    marginTop: 20,
  },
  secondary: {
    alignSelf: "stretch",
    height: 48,
    marginTop: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.textAccent,
  },
});
