import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>

      {["Perfil", "Notificaciones", "Privacidad"].map((item, i) => (
        <TouchableOpacity key={i} style={styles.settingCard}>
          <Text style={styles.settingTitle}>{item}</Text>
          <Text style={styles.settingSubtitle}>
            {i === 0
              ? "Edita tu información personal"
              : i === 1
              ? "Configura tus preferencias"
              : "Controla tu información"}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logoutCard}>
        <Text style={styles.logoutTitle}>Cerrar sesión</Text>
        <Text style={styles.logoutSubtitle}>Salir de tu cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A1A", marginBottom: 20 },
  settingCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderColor: "#EAEAEA",
    borderWidth: 1.5,
  },
  settingTitle: { color: "#1A1A1A", fontWeight: "600" },
  settingSubtitle: { color: "#1A1A1A99", fontSize: 13 },
  logoutCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderColor: "#FFDADA",
    borderWidth: 1.5,
    marginTop: 16,
  },
  logoutTitle: { color: "#D32F2F", fontWeight: "600" },
  logoutSubtitle: { color: "#1A1A1A99", fontSize: 13 },
});
