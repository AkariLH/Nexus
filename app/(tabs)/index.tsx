import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const events = [
    { id: "1", title: "Cena en pareja", date: "13 Nov", time: "16:00", shared: true },
    { id: "2", title: "Película juntos", date: "14 Nov", time: "16:00", shared: false },
  ];

  return (
    <View style={styles.container}>
      <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }}>
        <Text style={styles.logo}>Nexus</Text>
        <Text style={styles.subtitle}>Conectado con Akari 💕</Text>
      </MotiView>

      <LinearGradient colors={["#FF4F8115", "#8A2BE215"]} style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-outline" size={24} color="#FF4F81" />
            <Text style={styles.actionText}>Nuevo evento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={24} color="#8A2BE2" />
            <Text style={styles.actionText}>Ver calendario</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Próximos eventos</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <View style={[styles.dateBox, { backgroundColor: item.shared ? "#FF4F8120" : "#8A2BE220" }]}>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventTime}>{item.time}</Text>
            </View>
            {item.shared && <Ionicons name="heart" size={18} color="#FF4F81" />}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", padding: 20 },
  logo: { fontSize: 32, fontWeight: "700", color: "#1A1A1A" },
  subtitle: { color: "#1A1A1A99", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1A1A1A", marginVertical: 12 },
  quickActions: { borderRadius: 24, padding: 16, marginBottom: 20 },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  actionButton: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  actionText: { color: "#1A1A1A", marginTop: 6 },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dateBox: {
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dateText: { color: "#1A1A1A99", fontWeight: "600" },
  eventInfo: { flex: 1 },
  eventTitle: { fontWeight: "600", color: "#1A1A1A" },
  eventTime: { color: "#1A1A1A99" },
});
