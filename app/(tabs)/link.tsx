import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

export default function LinkScreen() {
  const isLinked = true;
  const partnerName = "Akari 💕";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vínculo emocional</Text>

      {isLinked ? (
        <LinearGradient colors={["#FF4F8115", "#8A2BE215"]} style={styles.linkCard}>
          <View style={styles.linkHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="heart" size={32} color="#FFF" />
            </View>
            <View>
              <Text style={styles.subText}>Conectado con</Text>
              <Text style={styles.partner}>{partnerName}</Text>
            </View>
          </View>
          <Text style={styles.details}>Ver detalles →</Text>
        </LinearGradient>
      ) : (
        <Text style={styles.empty}>Aún no estás vinculado 💔</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A1A", marginBottom: 20 },
  linkCard: { borderRadius: 24, padding: 20 },
  linkHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF4F81",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  subText: { color: "#1A1A1A99" },
  partner: { color: "#1A1A1A", fontSize: 18, fontWeight: "600" },
  details: { color: "#FF4F81", fontWeight: "500" },
  empty: { color: "#1A1A1A99", fontSize: 16 },
});
