import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette } from "../../constants/colors";
import { passwordChecks } from "../../utils/registerForm";

/**
 * Figma H2 (requisitos): las 5 reglas de RN-01 debajo del campo. Sin texto, círculo gris; al
 * escribir, palomita verde si se cumple o tache rojo si falta.
 */
export function PasswordRules({ password }: { password: string }) {
  const typed = password.length > 0;
  return (
    <View style={styles.list}>
      {passwordChecks(password).map(({ label, met }) => {
        const state = !typed ? "pendiente" : met ? "cumple" : "falta";
        return (
          <View key={label} style={styles.row} accessible accessibilityLabel={`${label}: ${state}`}>
            <Ionicons
              name={!typed ? "ellipse-outline" : met ? "checkmark-circle-outline" : "close"}
              size={16}
              color={!typed ? palette.textMuted : met ? palette.success : palette.error}
            />
            <Text style={[styles.text, typed && met && styles.textMet]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6, marginTop: -4, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  text: { fontSize: 13, lineHeight: 18, color: palette.textSecondary },
  textMet: { color: palette.text },
});
